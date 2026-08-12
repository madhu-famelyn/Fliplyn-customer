import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import { getLedger } from "./Service";
import "./Management.css";

export default function LedgerReport() {
  const { token } = useManagementAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await getLedger(token, start, end);
      setRows(data);
    } catch {
      setError("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const totalIncome = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalOutgo = rows.filter((r) => r.type === "outgo").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mgmt-page">
      <div className="mgmt-topbar">
        <h1>Full Ledger Report</h1>
        <button className="mgmt-btn-secondary" onClick={() => navigate("/manager-stalls")}>Back to OM Dashboard</button>
      </div>

      <div className="mgmt-nav">
        <Link to="/management/dashboard">Dashboard</Link>
        <Link to="/management/income">+ Income</Link>
        <Link to="/management/outgo">+ Outgo</Link>
        <Link to="/management/report" className="active">Full Report</Link>
        <Link to="/management/settings">Manage Dropdowns</Link>
      </div>

      <div className="mgmt-date-row">
        <label>From</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <label>To</label>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="mgmt-btn-primary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {error && <div className="mgmt-error">{error}</div>}

      {/* Summary row */}
      <div className="mgmt-kpi-row">
        <div className="mgmt-kpi-card">
          <div className="kpi-label">Income</div>
          <div className="kpi-value kpi-income">₹{totalIncome.toLocaleString("en-IN")}</div>
        </div>
        <div className="mgmt-kpi-card">
          <div className="kpi-label">Expenses</div>
          <div className="kpi-value kpi-outgo">₹{totalOutgo.toLocaleString("en-IN")}</div>
        </div>
        <div className="mgmt-kpi-card">
          <div className="kpi-label">Profit / Loss</div>
          <div className={`kpi-value ${totalIncome - totalOutgo >= 0 ? "kpi-profit" : "kpi-loss"}`}>
            ₹{(totalIncome - totalOutgo).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="mgmt-card">
        <h3>All Transactions</h3>
        <div className="mgmt-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Party</th><th>Account</th><th>Amount</th><th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af" }}>No transactions for selected period</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td><span className={r.type === "income" ? "badge-income" : "badge-outgo"}>{r.type}</span></td>
                  <td>{r.party}</td>
                  <td style={{ textTransform: "capitalize" }}>{r.account_name || "—"}</td>
                  <td style={{ fontWeight: 700, color: r.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {r.type === "income" ? "+" : "-"}₹{r.amount.toLocaleString("en-IN")}
                  </td>
                  <td>{r.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
