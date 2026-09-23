import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiInbox, FiLoader } from "react-icons/fi";
import "./AddRefund.css";

export default function RefundHistory({ adminId, refresh }) {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  useEffect(() => {
    if (!adminId) return;

    const fetchRefunds = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/refunds/admin/${adminId}`
        );
        setRefunds(res.data);
      } catch (err) {
        console.error("Error fetching refunds:", err);
        setRefunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [adminId, refresh]);

  useEffect(() => {
    if (!refunds.length) return;

    const now = new Date();
    let filtered = [...refunds];

    if (filter === "today") {
      filtered = refunds.filter((r) => {
        const d = new Date(r.created_at);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else if (filter === "thisWeek") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      filtered = refunds.filter((r) => new Date(r.created_at) >= startOfWeek);
    } else if (filter === "thisMonth") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = refunds.filter((r) => new Date(r.created_at) >= monthStart);
    } else if (filter === "custom") {
      if (customRange.from && customRange.to) {
        const fromDate = new Date(customRange.from);
        const toDate = new Date(customRange.to);
        toDate.setHours(23, 59, 59);
        filtered = refunds.filter(
          (r) =>
            new Date(r.created_at) >= fromDate &&
            new Date(r.created_at) <= toDate
        );
      }
    }

    setFilteredRefunds(filtered);
  }, [refunds, filter, customRange]);

  if (loading)
    return (
      <div className="refund-container">
        <div className="refund-loading">
          <FiLoader className="refund-spin" size={18} />
          <span>Loading refund history...</span>
        </div>
      </div>
    );
  if (!refunds.length)
    return (
      <div className="refund-container">
        <div className="refund-empty">
          <FiInbox size={28} />
          <span>No refunds found.</span>
        </div>
      </div>
    );

  return (
    <div className="refund-container">
      <h3 className="refund-title">Refund History</h3>

      {/* Filters */}
      <div className="refund-filters">
        <select
          className="refund-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="custom">Custom</option>
        </select>

        {filter === "custom" && (
          <div className="refund-date-range">
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, from: e.target.value }))
              }
            />
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
        )}
      </div>

      {/* Refund Table */}
      <div className="refund-table-wrapper">
        <table className="refund-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>User Email</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRefunds.length ? (
              filteredRefunds.map((refund) => (
                <tr key={refund.id}>
                  <td data-label="Token">
                    <span className="refund-token-chip">{refund.token_number}</span>
                  </td>
                  <td data-label="Amount">
                    <span className="refund-amount-badge">
                      ₹{Number(refund.refund_amount).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Reason">{refund.refund_reason || "—"}</td>
                  <td data-label="User Email">{refund.user_email}</td>
                  <td data-label="Date">
                    {new Date(refund.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-refunds">
                  No refunds for selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
