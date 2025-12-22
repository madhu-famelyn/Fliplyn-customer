// src/pages/vendor/ReportsPage.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
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

  // Extra filters
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");

  /* ================= DATE HELPERS ================= */
  const formatDate = (date) => date.toISOString().split("T")[0];

  const getDateRange = useCallback(() => {
    const today = new Date();

    if (filter === "today") {
      const end = new Date(today);
      end.setDate(today.getDate() + 1);
      return { start: formatDate(today), end: formatDate(end) };
    }

    if (filter === "week") {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(today);
      end.setDate(today.getDate() + 1);
      return { start: formatDate(start), end: formatDate(end) };
    }

    if (filter === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today);
      end.setDate(today.getDate() + 1);
      return { start: formatDate(start), end: formatDate(end) };
    }

    if (filter === "custom" && customRange.start && customRange.end) {
      return { start: customRange.start, end: customRange.end };
    }

    const end = new Date(today);
    end.setDate(today.getDate() + 1);
    return { start: formatDate(today), end: formatDate(end) };
  }, [filter, customRange]);

  /* ================= FETCH ORDERS ================= */
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

      if (data.length && data[0].order_details?.length) {
        setStallName(data[0].order_details[0].stall_name);
      }
    } catch (err) {
      console.error("❌ Error fetching reports:", err.message);
    } finally {
      setLoading(false);
    }
  }, [stallId, getDateRange]);

  useEffect(() => {
    if (filter === "custom" && (!customRange.start || !customRange.end)) return;
    fetchOrders();
  }, [stallId, filter, customRange, fetchOrders]);

  /* ================= COMPANY LIST ================= */
  const companyList = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      const domain = o.user_email?.split("@")[1];
      if (domain) set.add(domain);
    });
    return Array.from(set).sort();
  }, [orders]);

  /* ================= FILTERED ORDERS ================= */
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const company = o.user_email?.split("@")[1];
      const paymentType = o.paid_with_wallet ? "Postpaid" : "Prepaid";

      if (selectedCompany !== "all" && company !== selectedCompany) return false;
      if (selectedPayment !== "all" && paymentType !== selectedPayment)
        return false;

      return true;
    });
  }, [orders, selectedCompany, selectedPayment]);

  /* ================= CALCULATIONS ================= */

  // Net amount per order (price × qty)
  const getOrderNetAmount = (order) =>
    order.order_details.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

  const totalNetAmount = filteredOrders.reduce(
    (sum, o) => sum + getOrderNetAmount(o),
    0
  );

  const totalGST = filteredOrders.reduce(
    (sum, o) => sum + (o.total_gst || 0),
    0
  );

  const totalRoundOff = filteredOrders.reduce(
    (sum, o) => sum + (o.round_off || 0),
    0
  );

  const totalAmount = filteredOrders.reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );

  /* ================= UI ================= */
  return (
    <div className="reports-container">
      <h1>Reports for Stall: {stallName || "Loading..."}</h1>

      {/* FILTERS */}
      <div className="filter-controls">
        <label>Date:</label>
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

        <label>Company:</label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="all">All Companies</option>
          {companyList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>Payment:</label>
        <select
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Prepaid">Prepaid</option>
          <option value="Postpaid">Postpaid</option>
        </select>

        {filter === "custom" && (
          <>
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
            <button onClick={fetchOrders}>Apply</button>
          </>
        )}
      </div>

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
                  <th>Company</th>
                  <th>Payment</th>
                  <th>Token</th>
                  <th>Items (Price)</th>
                  <th>Net Amount</th>
                  <th>Total GST</th>
                  <th>Round Off</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center" }}>
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const d = new Date(o.created_datetime);
                    const company =
                      o.user_email?.split("@")[1] || "-";
                    const payment = o.paid_with_wallet
                      ? "Postpaid"
                      : "Prepaid";

                    const netAmount = getOrderNetAmount(o);

                    return (
                      <tr key={o.id}>
                        <td>{d.toLocaleDateString()}</td>
                        <td>{d.toLocaleTimeString()}</td>
                        <td>{company}</td>
                        <td>{payment}</td>
                        <td>{o.token_number}</td>

                        {/* ITEMS + PRICE */}
                        <td>
                          {o.order_details.map((i) => (
                            <div key={i.item_id}>
                              {i.name} × {i.quantity} — ₹
                              {i.price * i.quantity}
                            </div>
                          ))}
                        </td>

                        <td>₹{netAmount.toFixed(2)}</td>
                        <td>₹{o.total_gst?.toFixed(2) || "0.00"}</td>
                        <td>₹{o.round_off?.toFixed(2) || "0.00"}</td>
                        <td>₹{o.total_amount.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL SUMMARY */}
          <div className="totals-summary">
            <h2>Total Summary</h2>
            <p>Net Amount: ₹{totalNetAmount.toFixed(2)}</p>
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
