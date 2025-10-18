// src/pages/vendor/ReportsPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Reports.css";

const ReportsPage = () => {
  const { stallId } = useParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Helper to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

  // ✅ Compute start & end date based on filter
  const getDateRange = useCallback(() => {
    const today = new Date();

    if (filter === "today") {
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(today.getDate() + 1); // tomorrow
      return { start: formatDate(start), end: formatDate(end) };
    }

    if (filter === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return { start: formatDate(startOfWeek), end: formatDate(tomorrow) };
    }

    if (filter === "month") {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return { start: formatDate(firstOfMonth), end: formatDate(tomorrow) };
    }

    if (filter === "custom" && customRange.start && customRange.end) {
      return { start: customRange.start, end: customRange.end };
    }

    // Default fallback — today to tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { start: formatDate(today), end: formatDate(tomorrow) };
  }, [filter, customRange]);

  // ✅ Fetch orders from backend
  const fetchOrders = useCallback(async () => {
    if (!stallId) return;
    const { start, end } = getDateRange();

    setLoading(true);
    try {
      const res = await axios.get(
        `https://admin-aged-field-2794.fly.dev/orders/by-stall/${stallId}/range`,
        { params: { start_date: start, end_date: end } }
      );

      const data = res.data || [];
      setOrders(data);

      if (data.length > 0) {
        const first = data[0];
        if (first.order_details?.length > 0) {
          setStallName(first.order_details[0].stall_name);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching reports:", err.message);
    } finally {
      setLoading(false);
    }
  }, [stallId, getDateRange]);

  // ✅ Trigger fetch when filter/date changes
  useEffect(() => {
    if (filter === "custom" && (!customRange.start || !customRange.end)) return;
    fetchOrders();
  }, [stallId, filter, customRange, fetchOrders]);

  // ✅ Total Calculations
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalCGST = orders.reduce((sum, o) => sum + (o.cgst || 0), 0);
  const totalSGST = orders.reduce((sum, o) => sum + (o.sgst || 0), 0);
  const totalGST = orders.reduce((sum, o) => sum + (o.total_gst || 0), 0);
  const totalRoundOff = orders.reduce((sum, o) => sum + (o.round_off || 0), 0);

  return (
    <div className="reports-container">
      <h1>Reports for Stall: {stallName || "Loading..."}</h1>

      {/* 🔹 Filter Controls */}
      <div className="filter-controls">
        <label>Filter: </label>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            if (e.target.value !== "custom") {
              setCustomRange({ start: "", end: "" });
            }
          }}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom</option>
        </select>

        {filter === "custom" && (
          <span className="date-range">
            From:{" "}
            <input
              type="date"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
            />
            To:{" "}
            <input
              type="date"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
            />
            <button
              className="apply-btn"
              onClick={fetchOrders}
              disabled={!customRange.start || !customRange.end}
            >
              Apply
            </button>
          </span>
        )}
      </div>

      {/* 🔹 Table + Loading State */}
      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Token No</th>
                  <th>Item Name(s)</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Net Amount</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total GST</th>
                  <th>Round Off</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: "center" }}>
                      No orders found for selected range.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const date = new Date(order.created_datetime);
                    const totalNet = order.order_details.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    );

                    return (
                      <tr key={order.id}>
                        <td>{date.toLocaleDateString()}</td>
                        <td>{date.toLocaleTimeString()}</td>
                        <td>{order.token_number}</td>
                        <td>
                          {order.order_details.map((item) => (
                            <div key={item.item_id}>
                              {item.name}
                            </div>
                          ))}
                        </td>
                        <td>
                          {order.order_details.map((item) => (
                            <div key={item.item_id}>₹{item.price}</div>
                          ))}
                        </td>
                        <td>
                          {order.order_details.map((item) => (
                            <div key={item.item_id}>{item.quantity}</div>
                          ))}
                        </td>
                        <td>
                          {order.order_details.map((item) => (
                            <div key={item.item_id}>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          ))}
                          <strong>Total: ₹{totalNet.toFixed(2)}</strong>
                        </td>
                        <td>₹{order.cgst?.toFixed(2) || "0.00"}</td>
                        <td>₹{order.sgst?.toFixed(2) || "0.00"}</td>
                        <td>₹{order.total_gst?.toFixed(2) || "0.00"}</td>
                        <td>₹{order.round_off?.toFixed(2) || "0.00"}</td>
                        <td>₹{order.total_amount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 🔹 Totals Section */}
          <div className="totals-summary">
            <h2>Total Summary</h2>
            <p>CGST: ₹{totalCGST.toFixed(2)}</p>
            <p>SGST: ₹{totalSGST.toFixed(2)}</p>
            <p>Total GST: ₹{totalGST.toFixed(2)}</p>
            <p>Round Off: ₹{totalRoundOff.toFixed(2)}</p>
            <h2>Total Amount: ₹{totalAmount.toFixed(2)}</h2>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
