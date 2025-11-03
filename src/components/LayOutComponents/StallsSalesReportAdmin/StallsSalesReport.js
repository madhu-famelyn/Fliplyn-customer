import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import * as XLSX from "xlsx-js-style";
import "./stallsSalesReport.css";

export default function OutletSalesReportAdmin() {
  const { adminId } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("outlet");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch outlets initially
  useEffect(() => {
    const fetchOutlets = async () => {
      if (!adminId) return;
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/admin/${adminId}`
        );
        setOutlets(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch outlets.");
      }
    };
    fetchOutlets();
  }, [adminId]);

  // ✅ Fetch orders
  useEffect(() => {
    if (!adminId || !submitted) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        let fetchedOrders = [];

        const fetchOrdersByOutlet = async (outlet) => {
          const baseUrl = "https://admin-aged-field-2794.fly.dev/orders";
          const now = new Date();
          let startDate, endDate;

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
            const { start, end } = getUTCStartEndForISTDay(now);
            startDate = start;
            endDate = end;
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
          } else return [];

          try {
            const res = await axios.get(
              `${baseUrl}/by-stall/${outlet.id}/range`,
              { params: { start_date: startDate, end_date: endDate } }
            );
            return res.data.map((order) => ({
              ...order,
              outlet_name: outlet.name,
            }));
          } catch (err) {
            if (err.response?.status === 404) return [];
            throw err;
          }
        };

        if (selectedOutletId === "all") {
          for (let outlet of outlets) {
            const outletOrders = await fetchOrdersByOutlet(outlet);
            fetchedOrders.push(...outletOrders);
          }
        } else {
          const selectedOutlet = outlets.find(
            (s) => s.id === selectedOutletId
          );
          if (selectedOutlet) {
            const outletOrders = await fetchOrdersByOutlet(selectedOutlet);
            fetchedOrders.push(...outletOrders);
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
  }, [selectedOutletId, outlets, adminId, submitted, filter, customRange]);

  // ✅ Sorting
  const sortedOrders = [...orders].sort((a, b) =>
    sortBy === "date"
      ? new Date(a.created_datetime) - new Date(b.created_datetime)
      : a.outlet_name.localeCompare(b.outlet_name)
  );

  // ✅ Grand Total for Display
  const grandTotalPaid = sortedOrders.reduce((total, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return total + totalPaid;
  }, 0);

  // ✅ Export to Excel
const exportToExcel = () => {
  let totalNetAmount = 0;
  // let totalGross = 0;
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
        // "Gross Total": item.total,
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
    // "Gross Total": totalGross.toFixed(2),
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
    <div className="outlet-report-container-unique">
      <h2 className="outlet-report-title-unique">Outlet Sales Report</h2>

      {/* Filters */}
      <div className="outlet-report-filters-row-unique">
        <div className="outlet-report-dropdown-unique">
          <label>Select Outlet:</label>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
          >
            <option value="all">All Outlets</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>

        <div className="outlet-report-dropdown-unique">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="outlet">Outlet</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      {/* Date Filters */}
      <div className="outlet-report-date-filter-row">
        <label>Select Date Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="outlet-report-date-dropdown"
        >
          <option value="">Select Date Filter</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom</option>
        </select>



        {filter === "custom" && (
          <div className="outlet-report-custom-date-inputs">
            <input
              type="date"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
            />
            <input
              type="date"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="outlet-report-submit-btn-container-unique">
        <button
          className="outlet-report-submit-btn-unique"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
      <div className="outlet-report-total-summary">
            <strong>Total Paid (Selected Range): </strong>
            <span className="total-value">₹{grandTotalPaid.toFixed(2)}</span>
          </div>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Results */}
      {sortedOrders.length > 0 && (
        <>
          <div className="outlet-report-export-btn-unique">
            <button onClick={exportToExcel}>Export to Excel</button>
          </div>

          <table className="outlet-report-table-unique">
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
                {/* <th>Gross Total</th> */}
                <th>GST</th>
                <th>Round Off</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) =>
                order.order_details.map((item, index) => {
                  const netAmount = item.quantity * item.price;
                  const totalPaid =
                    order.order_details.reduce((sum, d) => sum + d.total, 0) +
                    (order.round_off || 0);
                  return (
                    <tr key={`${order.id}-${item.item_id}`}>
                      <td>{order.outlet_name}</td>
                      <td>{order.token_number}</td>
                      <td>{order.user_email}</td>
                      <td>
                        {new Date(order.created_datetime).toLocaleString(
                          "en-IN",
                          { timeZone: "Asia/Kolkata" }
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{netAmount.toFixed(2)}</td>
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

          {/* ✅ Total Paid Summary */}
          
        </>
      )}
    </div>
  );
}
