// src/Component/Pages/StallsReport/StallSalesReportBM.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useBuildingManagerAuth } from "../AuthContex/BuildingManagerContext";
import * as XLSX from "xlsx";

export default function StallSalesReportBM() {
  const { manager, token } = useBuildingManagerAuth();
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  // const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stall");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch stalls for manager's building
  useEffect(() => {
    if (!manager?.building_id || !token) return;

    const fetchStalls = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${manager.building_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStalls(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch stalls.");
      }
    };

    fetchStalls();
  }, [manager, token]);

  // ✅ Fetch orders after submission
  useEffect(() => {
    if (!manager?.building_id || !submitted || !token) return;

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
            const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
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
            const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const startOfWeek = new Date(istNow);
            startOfWeek.setDate(istNow.getDate() - istNow.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(istNow);
            endOfWeek.setHours(23, 59, 59, 999);

            startDate = startOfWeek.toISOString();
            endDate = endOfWeek.toISOString();
          } else if (filter === "month") {
            const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const startOfMonth = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
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
            try {
              const stallOrders = await fetchOrdersByStall(stall);
              fetchedOrders.push(...stallOrders);
            } catch {
              console.warn(`No orders for stall ${stall.name}`);
            }
          }
        } else {
          const selectedStall = stalls.find((s) => s.id === selectedStallId);
          if (selectedStall) {
            const stallOrders = await fetchOrdersByStall(selectedStall);
            fetchedOrders.push(...stallOrders);
          }
        }

        setOrders(fetchedOrders);
        localStorage.setItem("stallOrdersBM", JSON.stringify(fetchedOrders));
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
  }, [selectedStallId, stalls, manager, submitted, filter, customRange, token]);

  const sortedOrders = [...orders].sort((a, b) =>
    sortBy === "date"
      ? new Date(a.created_datetime) - new Date(b.created_datetime)
      : a.stall_name.localeCompare(b.stall_name)
  );

  const totalSales = sortedOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  const exportToExcel = () => {
    const rows = sortedOrders.flatMap((order) =>
      order.order_details.map((item, index) => ({
        Outlet: order.stall_name,
        Token: order.token_number,
        Date: new Date(order.created_datetime).toLocaleString(),
        Item: item.name,
        Qty: item.quantity,
        Price: item.price,
        "Net Amount": item.price * item.quantity,
        "Gross Total": index === 0 ? order.order_details.reduce((sum, d) => sum + d.total, 0) : "",
        GST: order.total_gst,
        "Round Off": index === 0 ? order.round_off : "",
        "Total Paid": index === 0 ? order.order_details.reduce((sum, d) => sum + d.total, 0) + (order.round_off || 0) : "",
      }))
    );

    // Add grand total row
    rows.push({
      "Total Paid": "Grand Total: ₹" + totalSales.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Make header bold
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (cell) cell.s = { font: { bold: true } };
    }

    // Make grand total bold
    const lastRow = range.e.r + 1;
    ws[XLSX.utils.encode_cell({ r: lastRow, c: range.e.c })].s = { font: { bold: true } };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Outlet Sales Report");
    XLSX.writeFile(wb, "Outlet_Sales_Report_BM.xlsx");
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
        <button
          className="stall-report-submit-btn-unique"
          onClick={handleSubmit}
        >
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
          <table className="stall-report-table-unique">
            <thead>
              <tr>
                <th>Outlet</th>
                <th>Token</th>
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
                  const netAmount = item.price * item.quantity;
                  const grossTotal =
                    index === 0
                      ? order.order_details.reduce((sum, d) => sum + d.total, 0)
                      : "";
                  const totalPaid =
                    index === 0
                      ? order.order_details.reduce((sum, d) => sum + d.total, 0) +
                        (order.round_off || 0)
                      : "";
                  return (
                    <tr key={`${order.id}-${item.item_id}`}>
                      <td>{order.stall_name}</td>
                      <td>{order.token_number}</td>
                      <td>
                        {new Date(order.created_datetime).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{netAmount}</td>
                      <td>{grossTotal}</td>
                      <td>₹{order.total_gst}</td>
                      <td>{index === 0 ? `₹${order.round_off}` : ""}</td>
                      <td>{index === 0 ? `₹${totalPaid.toFixed(2)}` : ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
