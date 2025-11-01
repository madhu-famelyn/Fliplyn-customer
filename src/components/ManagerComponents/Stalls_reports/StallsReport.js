import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./StallsReport.css";
import * as XLSX from "xlsx-js-style";

export default function StallSalesReport() {
  const { user } = useAuth();
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stall");
  const [submitted, setSubmitted] = useState(false);

  // Fetch stalls
  useEffect(() => {
    if (!user?.building_id) return;

    const fetchStalls = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
        );
        setStalls(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch outlets.");
      }
    };

    fetchStalls();
  }, [user]);

  // Fetch orders based on selected filter
  useEffect(() => {
    if (!user?.building_id || !submitted) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        let fetchedOrders = [];

        const fetchOrdersByStall = async (stall) => {
          const baseUrl = "https://admin-aged-field-2794.fly.dev/orders";
          let startDate, endDate;

          const now = new Date();

          const getUTCStartEndForISTDay = (date) => {
            const istDate = new Date(
              date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const istStart = new Date(istDate);
            istStart.setHours(0, 0, 0, 0);
            const istEnd = new Date(istStart);
            istEnd.setDate(istEnd.getDate() + 1);
            return { start: istStart.toISOString(), end: istEnd.toISOString() };
          };

          if (filter === "today") {
            ({ start: startDate, end: endDate } = getUTCStartEndForISTDay(now));
          } else if (filter === "week") {
            const istNow = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const startOfWeek = new Date(istNow);
            startOfWeek.setDate(istNow.getDate() - istNow.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(istNow);
            endOfWeek.setHours(23, 59, 59, 999);
            startDate = startOfWeek.toISOString();
            endDate = endOfWeek.toISOString();
          } else if (filter === "month") {
            const istNow = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const startOfMonth = new Date(
              istNow.getFullYear(),
              istNow.getMonth(),
              1
            );
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(istNow);
            endOfMonth.setHours(23, 59, 59, 999);
            startDate = startOfMonth.toISOString();
            endDate = endOfMonth.toISOString();
          } else if (filter === "custom") {
            if (!customRange.start || !customRange.end) return [];
            const start = new Date(customRange.start + "T00:00:00");
            const end = new Date(customRange.end + "T23:59:59");
            startDate = start.toISOString();
            endDate = end.toISOString();
          } else {
            return [];
          }

          try {
            const res = await axios.get(`${baseUrl}/by-stall/${stall.id}/range`, {
              params: { start_date: startDate, end_date: endDate },
            });
            return res.data.map((order) => ({ ...order, stall_name: stall.name }));
          } catch (err) {
            if (err.response?.status === 404) return [];
            throw err;
          }
        };

        if (selectedStallId === "all") {
          for (let stall of stalls) {
            const stallOrders = await fetchOrdersByStall(stall);
            fetchedOrders.push(...stallOrders);
          }
        } else {
          const selectedStall = stalls.find((s) => s.id === selectedStallId);
          if (selectedStall) {
            const stallOrders = await fetchOrdersByStall(selectedStall);
            fetchedOrders.push(...stallOrders);
          }
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
        setOrders([]);
      } finally {
        setLoading(false);
        setSubmitted(false);
      }
    };

    fetchOrders();
  }, [user, stalls, submitted, filter, customRange, selectedStallId]);

  // Company filter
  const getCompanyName = (email) => {
    if (!email) return "Unknown";
    const domain = email.split("@")[1] || "";
    return domain.includes("cashe") ? "cashe" : "Other";
  };

  const companyFilteredOrders =
    companyFilter === "all"
      ? orders
      : orders.filter((order) => getCompanyName(order.user_email) === companyFilter);

  const sortedOrders = [...companyFilteredOrders].sort((a, b) =>
    sortBy === "date"
      ? new Date(a.created_datetime) - new Date(b.created_datetime)
      : a.stall_name.localeCompare(b.stall_name)
  );

  const totalSales = sortedOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) + (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  const companies = Array.from(
    new Set(
      orders.map((o) => getCompanyName(o.user_email)).filter((c) => c === "cashe")
    )
  );

  // ✅ UPDATED Excel export

const exportToExcel = () => {
  let totalNetAmount = 0;
  let totalGross = 0;
  let totalGST = 0;
  let totalRoundOff = 0;
  let totalPaidAll = 0;

  const rows = sortedOrders.flatMap((order) =>
    order.order_details.map((item, index) => {
      const netAmount = item.quantity * item.price;
      const totalPaid =
        order.order_details.reduce((sum, d) => sum + d.total, 0) +
        (order.round_off || 0);

      // Accumulate totals (only once per order for GST, RoundOff, TotalPaid)
      totalNetAmount += netAmount;
      totalGross += item.total;
      if (index === 0) {
        totalGST += order.total_gst || 0;  // ✅ only once per order
        totalRoundOff += order.round_off || 0;
        totalPaidAll += totalPaid;
      }

      return {
        Outlet: order.outlet_name,
        Token: order.token_number,
        "User Email": order.user_email,
        Date: new Date(order.created_datetime).toLocaleString("en-IN"),
        Item: item.name,
        Qty: item.quantity,
        Price: item.price,
        "Net Amount": netAmount.toFixed(2),
        "Gross Total": item.total,
        GST: index === 0 ? order.total_gst || 0 : "", // ✅ only first item shows GST
        "Round Off": index === 0 ? order.round_off || 0 : "",
        "Total Paid": index === 0 ? totalPaid.toFixed(2) : "",
      };
    })
  );

  // Add Grand Total row
  rows.push({
    Outlet: "",
    Token: "",
    "User Email": "",
    Date: "",
    Item: "Grand Total",
    Qty: "",
    Price: "",
    "Net Amount": totalNetAmount.toFixed(2),
    "Gross Total": totalGross.toFixed(2),
    GST: totalGST.toFixed(2),
    "Round Off": totalRoundOff.toFixed(2),
    "Total Paid": totalPaidAll.toFixed(2),
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Style header row
  const header = Object.keys(rows[0]);
  header.forEach((col, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "000000" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  });

  // Style Grand Total row
  const lastRowIndex = rows.length; // 1-based
  header.forEach((col, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: lastRowIndex, c: idx });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "000000" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  });

  // Auto column widths
  const colWidths = header.map((h) => ({ wch: Math.max(h.length + 2, 15) }));
  ws["!cols"] = colWidths;

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Outlet Sales Report");

  // Save Excel file
  XLSX.writeFile(wb, "Outlet_Sales_Report.xlsx");
};



  const handleSubmit = () => {
    if (!filter) {
      alert("Please select a date filter (Today, Week, Month, or Custom)");
      return;
    }
    if (filter === "custom" && (!customRange.start || !customRange.end)) {
      alert("Please select both start and end dates for custom range.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="stall-report-container-unique">
      <h2 className="stall-report-title-unique">Outlet Sales Report</h2>

      <div className="stall-report-filters-row-unique">
        <div className="stall-report-dropdown-unique">
          <label htmlFor="stall-select">Select Outlet:</label>
          <select
            id="stall-select"
            value={selectedStallId}
            onChange={(e) => setSelectedStallId(e.target.value)}
          >
            <option value="all">All Outlets</option>
            {stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.name}
              </option>
            ))}
          </select>
        </div>

        <div className="stall-report-dropdown-unique">
          <label htmlFor="sort-select">Sort By:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="stall">Outlet</option>
            <option value="date">Date</option>
          </select>
        </div>

        <div className="stall-report-dropdown-unique">
          <label htmlFor="company-select">Filter by Company:</label>
          <select
            id="company-select"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stall-report-date-filter-row">
        <label htmlFor="date-filter-select" className="stall-report-date-label">
          Select Date Filter:
        </label>

        <select
          id="date-filter-select"
          className="stall-report-date-dropdown"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Select Date Filter</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom</option>
        </select>

        {filter === "custom" && (
          <div className="stall-report-custom-date-inputs">
            <input
              type="date"
              className="stall-report-date-dropdown"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
            />
            <input
              type="date"
              className="stall-report-date-dropdown"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="stall-report-submit-btn-container-unique">
        <button className="stall-report-submit-btn-unique" onClick={handleSubmit}>
          Submit
        </button>
      </div>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && sortedOrders.length === 0 && submitted && (
        <div className="stall-report-no-orders-unique">
          <p>No orders found for this date range.</p>
        </div>
      )}

      {sortedOrders.length > 0 && (
        <>
          <h3 className="stall-report-total-unique">
            Grand Total Sales: ₹{totalSales.toFixed(2)}
          </h3>
          <div className="stall-report-export-btn-unique">
            <button onClick={exportToExcel}>Export to Excel</button>
          </div>

          {/* ✅ Added scrollable wrapper */}
          <div className="stall-report-table-wrapper">
            <table className="stall-report-table-unique">
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Token</th>
                  <th>User Email</th>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Net Amount</th>
                  <th>Gross Total</th>
                  <th>GST</th>
                  <th>Round Off</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) =>
                  order.order_details.map((item, index) => {
                    const totalPaid =
                      order.order_details.reduce((sum, d) => sum + d.total, 0) +
                      (order.round_off || 0);
                    return (
                      <tr key={`${order.id}-${item.item_id}`}>
                        <td>{order.stall_name}</td>
                        <td>{order.token_number}</td>
                        <td>{order.user_email}</td>
                        <td>
                          {new Date(order.created_datetime).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </td>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>₹{(item.quantity * item.price).toFixed(2)}</td>
                        <td>₹{item.total}</td>
                        <td>₹{order.total_gst}</td>
                        <td>{index === 0 ? `₹${order.round_off}` : ""}</td>
                        <td>{index === 0 ? `₹${totalPaid.toFixed(2)}` : ""}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
