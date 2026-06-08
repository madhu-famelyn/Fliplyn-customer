import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import { printViaRawBT } from "../../../utils/printHelper";
import "./B2CTransactions.css";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

/* ── Date helpers ── */
const today = () => new Date().toISOString().split("T")[0];

/* ── Payment status map ── */
const statusClass = (s = "") => {
  const v = s.toUpperCase();
  if (v === "SUCCESS" || v === "COMPLETED") return "success";
  if (v === "FAILED" || v === "CANCELLED") return "failed";
  return "pending";
};

/* ── Token Receipt Modal ── */
function TokenModal({ order, onClose }) {
  const receiptRef = useRef(null);

  if (!order) return null;

  const stallName = order.order_details?.[0]?.stall_name || "Stall";
  const tokenNo = order.token_number || order.id?.slice(0, 4) || "—";
  const createdAt = new Date(order.created_datetime).toLocaleString("en-IN", {
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  const totalCgst = order.cgst ?? 0;
  const totalSgst = order.sgst ?? 0;
  const totalGst = order.total_gst ?? totalCgst + totalSgst;
  const roundOff = order.round_off ?? 0;
  const grandTotal = order.total_amount ?? 0;
  const subtotal = grandTotal - roundOff;

  const handlePrint = () => {
    if (window.Android && typeof window.Android.printToken === "function") {
      window.Android.printToken(JSON.stringify(order));
    } else if (
      window.iMinPrinter &&
      typeof window.iMinPrinter.printReceipt === "function"
    ) {
      window.iMinPrinter.printReceipt(JSON.stringify(order));
    } else {
      printViaRawBT(order);
    }
  };

  return (
    <div className="b2c-tx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="b2c-tx-modal-box">
        <div className="b2c-tx-receipt" ref={receiptRef} id="b2c-om-print-area">
          {/* Stall name */}
          <p className="b2c-tx-receipt-stall">{stallName}</p>

          {/* Token Hero */}
          <div className="b2c-tx-receipt-token-hero">
            <span className="b2c-tx-receipt-token-label">YOUR TOKEN NUMBER</span>
            <div className="b2c-tx-receipt-token-num">{tokenNo}</div>
          </div>

          <p className="b2c-tx-receipt-date">Date: {createdAt}</p>
          <hr className="b2c-tx-receipt-divider" />

          {/* Items table */}
          <table className="b2c-tx-receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rs</th>
              </tr>
            </thead>
            <tbody>
              {order.order_details?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td>{Number(item.price ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="b2c-tx-receipt-divider" />

          {/* Summary */}
          <div className="b2c-tx-receipt-summary">
            <span>CGST</span><span>₹{totalCgst.toFixed(2)}</span>
          </div>
          <div className="b2c-tx-receipt-summary">
            <span>SGST</span><span>₹{totalSgst.toFixed(2)}</span>
          </div>
          <div className="b2c-tx-receipt-summary">
            <span>Total GST</span><span>₹{totalGst.toFixed(2)}</span>
          </div>
          <div className="b2c-tx-receipt-summary">
            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="b2c-tx-receipt-summary">
            <span>Round Off</span><span>{roundOff >= 0 ? "+" : ""}{roundOff.toFixed(2)}</span>
          </div>
          <div className="b2c-tx-receipt-grand">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="b2c-tx-modal-actions">
          <button className="b2c-tx-modal-close-btn" onClick={onClose}>
            Close
          </button>
          <button className="b2c-tx-modal-print-btn" onClick={handlePrint}>
            🖨️ Print Token
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function B2CTransactions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("TODAY");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ── Fetch stalls belonging to this OM's building ── */
  useEffect(() => {
    if (!user?.building_id) return;
    axios
      .get(`${API_BASE}/stalls/building/${user.building_id}`)
      .then((res) => setStalls(res.data || []))
      .catch((err) => console.error("Failed to fetch stalls:", err));
  }, [user]);

  /* ── Resolve date range ── */
  const resolveDates = useCallback(() => {
    const now = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];

    if (dateFilter === "TODAY") {
      const d = fmt(now);
      return [d, d];
    }
    if (dateFilter === "WEEK") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return [fmt(start), fmt(now)];
    }
    if (dateFilter === "MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return [fmt(start), fmt(now)];
    }
    return [startDate, endDate];
  }, [dateFilter, startDate, endDate]);

  /* ── Fetch B2C orders ── */
  const fetchOrders = async () => {
    setError("");
    setOrders([]);

    const [start, end] = resolveDates();
    if (!start || !end) {
      setError("Please select a valid date range.");
      return;
    }

    setLoading(true);
    try {
      // Collect stall IDs to query
      let stallIds = [];
      if (selectedStall === "ALL") {
        stallIds = stalls.map((s) => s.id || s.stall_id);
      } else {
        stallIds = [selectedStall];
      }

      if (stallIds.length === 0) {
        setError("No stalls found for this building.");
        setLoading(false);
        return;
      }

      // Fetch orders for each stall in parallel
      const promises = stallIds.map((sid) =>
        axios
          .get(
            `${API_BASE}/orders/by-stall/${sid}/range?start_date=${start}T00:00:00&end_date=${end}T23:59:59`
          )
          .then((res) => res.data || [])
          .catch(() => []) // silently skip stalls with no orders
      );

      const results = await Promise.all(promises);
      const allOrders = results.flat();

      // Sort newest first
      allOrders.sort(
        (a, b) =>
          new Date(b.created_datetime) - new Date(a.created_datetime)
      );

      setOrders(allOrders);
      if (allOrders.length === 0) {
        setError("No B2C transactions found for the selected filters.");
      }
    } catch (err) {
      console.error("Error fetching B2C orders:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Stats ── */
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );
  const successOrders = orders.filter(
    (o) =>
      (o.payment_status || "").toUpperCase() === "SUCCESS" ||
      (o.order_status || "").toUpperCase() === "COMPLETED"
  ).length;

  /* ── Handle view / print ── */
  const handleViewToken = (order) => {
    setSelectedOrder(order);
  };

  /* ── Render ── */
  return (
    <div className="b2c-tx-container">
      {/* Back */}
      <button
        className="b2c-tx-back-btn"
        onClick={() => navigate("/manager-stalls")}
        id="b2c-tx-back-btn"
      >
        ← Back to Dashboard
      </button>

      {/* Page Header */}
      <div className="b2c-tx-page-header">
        <div className="b2c-tx-icon-badge">🛒</div>
        <div>
          <h2 className="b2c-tx-title">B2C Transactions</h2>
          <p className="b2c-tx-subtitle">
            View and print tokens for all B2C orders in your building
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="b2c-tx-controls-card">
        <div className="b2c-tx-controls-left">
          {/* Stall filter */}
          <select
            className="b2c-tx-select"
            value={selectedStall}
            onChange={(e) => setSelectedStall(e.target.value)}
            id="b2c-tx-stall-select"
          >
            <option value="ALL">🏪 All Stalls</option>
            {stalls.map((s) => (
              <option key={s.id || s.stall_id} value={s.id || s.stall_id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Date filter */}
          <select
            className="b2c-tx-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            id="b2c-tx-date-filter"
          >
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>

          {dateFilter === "CUSTOM" && (
            <>
              <input
                type="date"
                className="b2c-tx-date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                id="b2c-tx-start-date"
              />
              <input
                type="date"
                className="b2c-tx-date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                id="b2c-tx-end-date"
              />
            </>
          )}
        </div>

        <button
          className="b2c-tx-fetch-btn"
          onClick={fetchOrders}
          disabled={loading}
          id="b2c-tx-fetch-btn"
        >
          {loading ? (
            <>
              <span className="b2c-tx-loader" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Loading…
            </>
          ) : (
            <>🔍 Load Transactions</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="b2c-tx-error">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      {orders.length > 0 && (
        <div className="b2c-tx-stats-strip">
          <div className="b2c-tx-stat-card">
            <div className="b2c-tx-stat-label">Total Orders</div>
            <div className="b2c-tx-stat-value">{orders.length}</div>
            <span className="b2c-tx-stat-icon">🧾</span>
          </div>
          <div className="b2c-tx-stat-card">
            <div className="b2c-tx-stat-label">Successful</div>
            <div className="b2c-tx-stat-value">{successOrders}</div>
            <span className="b2c-tx-stat-icon">✅</span>
          </div>
          <div className="b2c-tx-stat-card">
            <div className="b2c-tx-stat-label">Total Revenue</div>
            <div className="b2c-tx-stat-value">
              ₹{Math.floor(totalRevenue).toLocaleString("en-IN")}
            </div>
            <span className="b2c-tx-stat-icon">💰</span>
          </div>
          <div className="b2c-tx-stat-card">
            <div className="b2c-tx-stat-label">Avg. Order</div>
            <div className="b2c-tx-stat-value">
              ₹{orders.length > 0 ? Math.floor(totalRevenue / orders.length).toLocaleString("en-IN") : 0}
            </div>
            <span className="b2c-tx-stat-icon">📊</span>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="b2c-tx-loader-wrap">
          <div className="b2c-tx-loader" />
          <span className="b2c-tx-loader-text">Fetching transactions…</span>
        </div>
      )}

      {/* Table */}
      {!loading && orders.length > 0 && (
        <div className="b2c-tx-table-card">
          <div className="b2c-tx-table-header-bar">
            <div className="b2c-tx-table-title">🛒 B2C Transactions</div>
            <span className="b2c-tx-row-count">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="b2c-tx-table-wrapper">
            <table className="b2c-tx-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Stall</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const stallName =
                    order.order_details?.[0]?.stall_name || "—";
                  const tokenNo =
                    order.token_number || order.id?.slice(0, 4) || "—";
                  const dateStr = new Date(
                    order.created_datetime
                  ).toLocaleString("en-IN", {
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const status =
                    order.payment_status || order.order_status || "PENDING";

                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="b2c-tx-token-badge">
                          🎟 {tokenNo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#7c2d12" }}>
                        {stallName}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {order.user_phone || "—"}
                        </div>
                        <div className="b2c-tx-email">{order.user_email || ""}</div>
                      </td>
                      <td>
                        <span className="b2c-tx-amount">
                          ₹{Number(order.total_amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`b2c-tx-status ${statusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: "#78716c" }}>
                        {dateStr}
                      </td>
                      <td>
                        <button
                          className="b2c-tx-print-btn"
                          onClick={() => handleViewToken(order)}
                          id={`b2c-view-token-${order.id}`}
                        >
                          🎟 View & Print Token
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state (only shown after a fetch with no results and no error) */}
      {!loading && !error && orders.length === 0 && (
        <div className="b2c-tx-table-card">
          <div className="b2c-tx-empty">
            <div className="b2c-tx-empty-icon">🛒</div>
            <div className="b2c-tx-empty-text">No transactions yet</div>
            <div className="b2c-tx-empty-hint">
              Select a stall & date range, then click "Load Transactions"
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {selectedOrder && (
        <TokenModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
