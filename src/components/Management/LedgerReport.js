import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import { getLedger } from "./Service";
import "./Management.css";

export default function LedgerReport() {
  const { token, logout } = useManagementAuth();
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

  useEffect(() => {
    const activeToken = token || localStorage.getItem("mgmtToken") || localStorage.getItem("token");
    if (!activeToken) {
      navigate("/", { replace: true });
      return;
    }
    load();
  }, [token, navigate]); // eslint-disable-line

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const incomeRows = rows.filter((r) => r.type === "income");
  const outgoRows = rows.filter((r) => r.type === "outgo");

  const totalIncomeGross = incomeRows.reduce((s, r) => s + (r.gross_amount ?? r.amount), 0);
  const totalIncomeGst = incomeRows.reduce((s, r) => s + (r.gst_amount ?? 0), 0);
  const totalIncomeNet = incomeRows.reduce((s, r) => s + (r.net_amount ?? r.amount), 0);

  const totalOutgoGross = outgoRows.reduce((s, r) => s + (r.gross_amount ?? r.amount), 0);
  const totalOutgoGst = outgoRows.reduce((s, r) => s + (r.gst_amount ?? 0), 0);
  const totalOutgoNet = outgoRows.reduce((s, r) => s + (r.net_amount ?? r.amount), 0);

  const netProfitLoss = totalIncomeNet - totalOutgoNet;

  return (
    <div className="mgmt-page">
      <div className="mgmt-topbar">
        <h1>Full Ledger Report</h1>
        <button className="mgmt-btn-secondary" onClick={handleLogout}>Logout</button>
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
        <div className="mgmt-kpi-card mgmt-kpi-3in1">
          <div className="kpi-label">Income (Sales)</div>
          <div className="kpi-3in1-grid">
            <div className="kpi-sub-item">
              <span className="kpi-sub-label">Gross</span>
              <span className="kpi-sub-value">₹{totalIncomeGross.toLocaleString("en-IN")}</span>
            </div>
            <div className="kpi-sub-item">
              <span className="kpi-sub-label">GST</span>
              <span className="kpi-sub-value kpi-gst-text">₹{totalIncomeGst.toLocaleString("en-IN")}</span>
            </div>
            <div className="kpi-sub-item kpi-highlight">
              <span className="kpi-sub-label">Net Sales</span>
              <span className="kpi-sub-value kpi-income">₹{totalIncomeNet.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="mgmt-kpi-card mgmt-kpi-3in1">
          <div className="kpi-label">Expenses (Outgo)</div>
          <div className="kpi-3in1-grid">
            <div className="kpi-sub-item">
              <span className="kpi-sub-label">Gross</span>
              <span className="kpi-sub-value">₹{totalOutgoGross.toLocaleString("en-IN")}</span>
            </div>
            <div className="kpi-sub-item">
              <span className="kpi-sub-label">GST</span>
              <span className="kpi-sub-value kpi-gst-text">₹{totalOutgoGst.toLocaleString("en-IN")}</span>
            </div>
            <div className="kpi-sub-item kpi-highlight">
              <span className="kpi-sub-label">Net Outgo</span>
              <span className="kpi-sub-value kpi-outgo">₹{totalOutgoNet.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="mgmt-kpi-card">
          <div className="kpi-label">Profit / Loss (Net)</div>
          <div className={`kpi-value ${netProfitLoss >= 0 ? "kpi-profit" : "kpi-loss"}`}>
            ₹{netProfitLoss.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="mgmt-card">
        <h3>All Transactions</h3>
        <div className="mgmt-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Party</th>
                <th>Account</th>
                <th>GST</th>
                <th>Gross</th>
                <th>GST Amt</th>
                <th>Net Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "#9ca3af" }}>No transactions for selected period</td></tr>
              )}
              {rows.map((r, i) => {
                const gross = Number(r.gross_amount ?? r.amount ?? 0);
                const gst = Number(r.gst_amount ?? 0);
                const net = Number(r.net_amount ?? (gross - gst));
                const isInc = r.type === "income";
                return (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td><span className={isInc ? "badge-income" : "badge-outgo"}>{r.type}</span></td>
                    <td>{r.party}</td>
                    <td style={{ textTransform: "capitalize" }}>{r.account_name || "—"}</td>
                    <td>
                      <span className={`mgmt-badge ${r.is_gst ? "badge-gst-yes" : "badge-gst-no"}`}>
                        {r.is_gst ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>₹{gross.toLocaleString("en-IN")}</td>
                    <td>₹{gst.toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: 700, color: isInc ? "#16a34a" : "#dc2626" }}>
                      {isInc ? "+" : "-"}₹{net.toLocaleString("en-IN")}
                    </td>
                    <td>{r.description || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
