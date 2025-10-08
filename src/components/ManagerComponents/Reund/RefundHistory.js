import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AddRefund.css";

export default function RefundHistory({ managerId, refresh }) {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  useEffect(() => {
    if (!managerId) return;

    const fetchRefunds = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/refunds/manager/${managerId}`
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
  }, [managerId, refresh]);

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
      const startOfWeek = new Date(
        now.setDate(now.getDate() - now.getDay())
      );
      filtered = refunds.filter((r) => new Date(r.created_at) >= startOfWeek);
    } else if (filter === "thisMonth") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = refunds.filter((r) => new Date(r.created_at) >= monthStart);
    } else if (filter === "custom") {
      if (customRange.from && customRange.to) {
        const fromDate = new Date(customRange.from);
        const toDate = new Date(customRange.to);
        toDate.setHours(23, 59, 59); // include entire end day
        filtered = refunds.filter(
          (r) => new Date(r.created_at) >= fromDate && new Date(r.created_at) <= toDate
        );
      }
    }

    setFilteredRefunds(filtered);
  }, [refunds, filter, customRange]);

  if (loading) return <p>Loading refund history...</p>;
  if (!refunds.length) return <p>No refunds found.</p>;

  return (
    <div className="refund-history">
      <h3>Refund History</h3>

      {/* Filter controls */}
      <div className="refund-filters" style={{ marginBottom: "15px" }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginRight: "10px", padding: "5px" }}
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="custom">Custom</option>
        </select>

        {filter === "custom" && (
          <span>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, from: e.target.value }))
              }
              style={{ marginRight: "5px", padding: "5px" }}
            />
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, to: e.target.value }))
              }
              style={{ marginRight: "5px", padding: "5px" }}
            />
          </span>
        )}
      </div>

      {/* Refund table */}
      <table>
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
                <td>{refund.token_number}</td>
                <td>{refund.refund_amount}</td>
                <td>{refund.refund_reason}</td>
                <td>{refund.user_email}</td>
                <td>{new Date(refund.created_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No refunds for selected period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
