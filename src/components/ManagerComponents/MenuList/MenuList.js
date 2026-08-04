import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "./MenuList.css";

export default function OMMenuList() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [stalls, setStalls] = useState([]);
  const [selectedStallIds, setSelectedStallIds] = useState([]);
  const [itemsMap, setItemsMap] = useState({}); // { stallId: [items] }
  const [loadingStalls, setLoadingStalls] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | VEG | NON_VEG
  const [filterAvailability, setFilterAvailability] = useState("ALL"); // ALL | ACTIVE | PAUSED

  /* ---------------- FETCH STALLS ---------------- */
  useEffect(() => {
    if (!user?.building_id) return;

    const fetchStalls = async () => {
      try {
        setLoadingStalls(true);
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const fetchedStalls = res.data || [];
        setStalls(fetchedStalls);
        // By default select all outlets
        const allIds = fetchedStalls.map((s) => s.id);
        setSelectedStallIds(allIds);
      } catch (err) {
        console.error("❌ Error fetching stalls:", err);
      } finally {
        setLoadingStalls(false);
      }
    };

    fetchStalls();
  }, [user, token]);

  /* ---------------- FETCH ITEMS FOR SELECTED STALLS ---------------- */
  useEffect(() => {
    if (selectedStallIds.length === 0) {
      return;
    }

    const fetchItemsForStalls = async () => {
      try {
        setLoadingItems(true);

        const fetchPromises = selectedStallIds.map(async (stallId) => {
          try {
            const res = await axios.get(
              `https://admin-aged-field-2794.fly.dev/items/stall/${stallId}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            return { stallId, items: Array.isArray(res.data) ? res.data : [] };
          } catch (err) {
            console.error(`Error fetching items for stall ${stallId}:`, err);
            return { stallId, items: [] };
          }
        });

        const results = await Promise.all(fetchPromises);
        setItemsMap((prevMap) => {
          const updated = { ...prevMap };
          results.forEach(({ stallId, items }) => {
            updated[stallId] = items;
          });
          return updated;
        });
      } catch (err) {
        console.error("❌ Error loading items:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItemsForStalls();
  }, [selectedStallIds, token]);

  /* ---------------- STALL CHECKBOX HANDLERS ---------------- */
  const handleToggleStall = (stallId) => {
    setSelectedStallIds((prev) =>
      prev.includes(stallId)
        ? prev.filter((id) => id !== stallId)
        : [...prev, stallId]
    );
  };

  const handleSelectAllStalls = () => {
    if (selectedStallIds.length === stalls.length) {
      setSelectedStallIds([]);
    } else {
      setSelectedStallIds(stalls.map((s) => s.id));
    }
  };

  /* ---------------- STALL-WISE GROUPED MENU ITEMS ---------------- */
  const stallGroupedMenuItems = useMemo(() => {
    const groups = [];

    selectedStallIds.forEach((stallId) => {
      const stallObj = stalls.find((s) => s.id === stallId);
      const stallName = stallObj ? stallObj.name : "Stall";
      let items = itemsMap[stallId] || [];

      // Apply search filter
      if (searchTerm) {
        items = items.filter(
          (item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stallName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply Type filter
      if (filterType === "VEG") items = items.filter((i) => i.is_veg);
      if (filterType === "NON_VEG") items = items.filter((i) => !i.is_veg);

      // Apply Availability filter
      if (filterAvailability === "ACTIVE") items = items.filter((i) => i.is_available);
      if (filterAvailability === "PAUSED") items = items.filter((i) => !i.is_available);

      if (items.length > 0) {
        groups.push({
          stallId,
          stallName,
          items,
        });
      }
    });

    return groups;
  }, [selectedStallIds, itemsMap, stalls, searchTerm, filterType, filterAvailability]);

  const totalItemCount = useMemo(() => {
    return stallGroupedMenuItems.reduce((acc, g) => acc + g.items.length, 0);
  }, [stallGroupedMenuItems]);

  /* ---------------- EXPORT TO EXCEL (.xlsx) (STALL WISE TABS) ---------------- */
  const exportToExcel = () => {
    if (stallGroupedMenuItems.length === 0) {
      alert("No menu items to export. Please select at least one outlet.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 1. All Items Master Sheet
    let masterRows = [];
    let globalIdx = 1;

    stallGroupedMenuItems.forEach((group) => {
      group.items.forEach((item) => {
        masterRows.push({
          "S.No": globalIdx++,
          "Outlet Name": group.stallName,
          "Item Name": item.name,
          "Type": item.is_veg ? "Veg" : "Non-Veg",
          "GST %": item.Gst_precentage ? `${item.Gst_precentage}%` : "0%",
          "Price": `₹${item.final_price || item.price}`,
        });
      });
    });

    const masterSheet = XLSX.utils.json_to_sheet(masterRows);
    masterSheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 30 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, masterSheet, "All Outlets Summary");

    // 2. Dedicated Sheet Per Outlet / Stall
    stallGroupedMenuItems.forEach((group) => {
      const stallRows = group.items.map((item, idx) => ({
        "S.No": idx + 1,
        "Item Name": item.name,
        "Type": item.is_veg ? "Veg" : "Non-Veg",
        "GST %": item.Gst_precentage ? `${item.Gst_precentage}%` : "0%",
        "Price": `₹${item.final_price || item.price}`,
      }));

      // Clean sheet name (Excel limits sheet names to 31 chars and no special chars)
      const cleanSheetName = (group.stallName || "Stall")
        .replace(/[\\/?*:[\]]/g, "_")
        .slice(0, 30);

      const stallSheet = XLSX.utils.json_to_sheet(stallRows);
      stallSheet["!cols"] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 12 },
        { wch: 10 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(workbook, stallSheet, cleanSheetName);
    });

    XLSX.writeFile(
      workbook,
      `Fliplyn_Stallwise_Menu_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ---------------- EXPORT TO PDF (.pdf) (STALL WISE PAGES) ---------------- */
  const exportToPDF = () => {
    if (stallGroupedMenuItems.length === 0) {
      alert("No menu items to export. Please select at least one outlet.");
      return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 36;

    stallGroupedMenuItems.forEach((group, stallIdx) => {
      if (stallIdx > 0) {
        doc.addPage(); // Fresh page per stall!
      }

      let y = margin + 15;

      // Header Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 106, 0); // Orange brand color
      doc.text("FLIPLYN - OUTLET MENU & PRICE LIST", margin, y);
      y += 20;

      // Outlet Banner Section
      doc.setFillColor(255, 247, 237); // Light orange bg
      doc.rect(margin, y - 10, 523, 26, "F");
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text(`OUTLET: ${group.stallName.toUpperCase()} (${group.items.length} Items)`, margin + 10, y + 7);
      y += 26;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, margin, y);
      y += 18;

      // Table Header Bar
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y - 10, 523, 20, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);

      doc.text("S.No", margin + 5, y);
      doc.text("Item Name", margin + 45, y);
      doc.text("Type", margin + 320, y);
      doc.text("GST %", margin + 410, y);
      doc.text("Price", margin + 470, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);

      group.items.forEach((item, idx) => {
        if (y > 780) {
          doc.addPage();
          y = margin + 20;

          // Repeat Stall Banner on new page
          doc.setFillColor(255, 247, 237);
          doc.rect(margin, y - 10, 523, 22, "F");
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(234, 88, 12);
          doc.text(`OUTLET: ${group.stallName.toUpperCase()} (Contd.)`, margin + 10, y + 5);
          y += 22;

          // Repeat Table Header Bar
          doc.setFillColor(243, 244, 246);
          doc.rect(margin, y - 10, 523, 20, "F");
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          doc.text("S.No", margin + 5, y);
          doc.text("Item Name", margin + 45, y);
          doc.text("Type", margin + 320, y);
          doc.text("GST %", margin + 410, y);
          doc.text("Price", margin + 470, y);
          y += 18;
          doc.setFont("helvetica", "normal");
        }

        doc.text(`${idx + 1}`, margin + 5, y);
        doc.text((item.name || "").slice(0, 38), margin + 45, y);
        doc.text(item.is_veg ? "Veg" : "Non-Veg", margin + 320, y);
        doc.text(item.Gst_precentage ? `${item.Gst_precentage}%` : "0%", margin + 410, y);
        doc.text(`Rs.${item.final_price || item.price || 0}`, margin + 470, y);
        y += 16;
      });
    });

    doc.save(`Fliplyn_Stallwise_Menu_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="om-ml-wrapper">
      {/* TOP NAV BAR */}
      <div className="om-ml-header">
        <div>
          <button className="om-ml-back-btn" onClick={() => navigate("/manager-stalls")}>
            ← Back to Outlets
          </button>
          <h1 className="om-ml-title">📋 Outlet Menu & Price List</h1>
          <p className="om-ml-subtitle">
            Select outlets using checkboxes below to view & download stall-wise price menus in PDF or Excel format.
          </p>
        </div>

        <div className="om-ml-export-buttons">
          <button className="om-ml-export-btn pdf" onClick={exportToPDF}>
            📄 Download PDF (Stall Pages)
          </button>
          <button className="om-ml-export-btn excel" onClick={exportToExcel}>
            📊 Download Excel (Stall Tabs)
          </button>
        </div>
      </div>

      {/* OUTLET SELECTION CHECKBOXES SECTION */}
      <div className="om-ml-outlets-card">
        <div className="om-ml-outlets-header">
          <h3>
            Select Outlets ({selectedStallIds.length}/{stalls.length} Selected)
          </h3>
          <label className="om-ml-select-all">
            <input
              type="checkbox"
              checked={stalls.length > 0 && selectedStallIds.length === stalls.length}
              onChange={handleSelectAllStalls}
            />
            <span>Select All Outlets</span>
          </label>
        </div>

        {loadingStalls ? (
          <p className="om-ml-loading-text">Loading outlets...</p>
        ) : stalls.length === 0 ? (
          <p className="om-ml-loading-text">No outlets found for this location.</p>
        ) : (
          <div className="om-ml-stalls-grid">
            {stalls.map((stall) => {
              const isChecked = selectedStallIds.includes(stall.id);
              return (
                <label
                  key={stall.id}
                  className={`om-ml-stall-chip ${isChecked ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleStall(stall.id)}
                  />
                  <span className="om-ml-stall-name">{stall.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="om-ml-controls-card">
        <input
          type="text"
          className="om-ml-search-input"
          placeholder="Search by item name or outlet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="om-ml-filter-group">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="om-ml-select"
          >
            <option value="ALL">All Types (Veg & Non-Veg)</option>
            <option value="VEG">Veg Only 🟢</option>
            <option value="NON_VEG">Non-Veg Only 🔴</option>
          </select>

          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="om-ml-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Available</option>
            <option value="PAUSED">Paused / Unavailable</option>
          </select>
        </div>
      </div>

      {/* MENU ITEMS BY STALL */}
      <div className="om-ml-table-card">
        <div className="om-ml-table-summary">
          <span>Showing <strong>{totalItemCount}</strong> items across <strong>{stallGroupedMenuItems.length}</strong> selected outlets</span>
        </div>

        {loadingItems ? (
          <p className="om-ml-loading-text">Loading menu items...</p>
        ) : stallGroupedMenuItems.length === 0 ? (
          <div className="om-ml-empty-state">
            <p>No menu items match your selection.</p>
            <small>Tick one or more outlet checkboxes above to view items.</small>
          </div>
        ) : (
          <div className="om-ml-grouped-container">
            {stallGroupedMenuItems.map((group) => (
              <div key={group.stallId} className="om-ml-stall-section">
                <div className="om-ml-stall-section-header">
                  <h3>🏪 {group.stallName}</h3>
                  <span className="om-ml-count-badge">{group.items.length} Items</span>
                </div>

                <div className="om-ml-table-responsive">
                  <table className="om-ml-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Type</th>
                        <th>GST %</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, index) => (
                        <tr key={`${item.id}-${index}`}>
                          <td>{index + 1}</td>
                          <td className="om-ml-item-name-cell">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="om-ml-item-img"
                              />
                            )}
                            <span>{item.name}</span>
                          </td>
                          <td>
                            <span className={`om-ml-veg-badge ${item.is_veg ? "veg" : "nonveg"}`}>
                              {item.is_veg ? "🟢 Veg" : "🔴 Non-Veg"}
                            </span>
                          </td>
                          <td>{item.Gst_precentage ? `${item.Gst_precentage}%` : "0%"}</td>
                          <td className="om-ml-price-bold">₹{item.final_price || item.price || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
