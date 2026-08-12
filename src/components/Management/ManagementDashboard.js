import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import { getDashboard } from "./Service";
import "./Management.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ManagementDashboard() {
  const { token, logout } = useManagementAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboard(token, start, end);
      setData(res);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleLogout = () => {
    logout();
    navigate("/management");
  };

  return (
    <div className="mgmt-page">
      {/* Top bar */}
      <div className="mgmt-topbar">
        <h1>Management Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="mgmt-btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Nav */}
      <div className="mgmt-nav">
        <Link to="/management/dashboard" className="active">Dashboard</Link>
        <Link to="/management/income">+ Income</Link>
        <Link to="/management/outgo">+ Outgo</Link>
        <Link to="/management/report">Full Report</Link>
        <Link to="/management/settings">Manage Dropdowns</Link>
      </div>

      {/* Date filter */}
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

      {data && (
        <>
          {/* KPI cards */}
          <div className="mgmt-kpi-row">
            <div className="mgmt-kpi-card">
              <div className="kpi-label">Total Income</div>
              <div className={`kpi-value kpi-income`}>{fmt(data.total_income)}</div>
            </div>
            <div className="mgmt-kpi-card">
              <div className="kpi-label">Total Expenses</div>
              <div className={`kpi-value kpi-outgo`}>{fmt(data.total_outgo)}</div>
            </div>
            <div className="mgmt-kpi-card">
              <div className="kpi-label">Profit / Loss</div>
              <div className={`kpi-value ${data.profit_or_loss >= 0 ? "kpi-profit" : "kpi-loss"}`}>
                {fmt(data.profit_or_loss)}
              </div>
            </div>
          </div>

          {/* Income breakdown */}
          <div className="mgmt-breakdown-grid">
            <div className="mgmt-card">
              <h3>Income by Source</h3>
              {data.income_by_source.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No entries</p>}
              {data.income_by_source.map((r) => (
                <div className="mgmt-breakdown-item" key={r.name}>
                  <span>{r.name}</span>
                  <span>{fmt(r.total)}</span>
                </div>
              ))}
            </div>

            <div className="mgmt-card">
              <h3>Income by Account</h3>
              {data.income_by_account.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No entries</p>}
              {data.income_by_account.map((r) => (
                <div className="mgmt-breakdown-item" key={r.account}>
                  <span style={{ textTransform: "capitalize" }}>{r.account}</span>
                  <span>{fmt(r.total)}</span>
                </div>
              ))}
            </div>

            <div className="mgmt-card">
              <h3>Expenses by Destination</h3>
              {data.outgo_by_destination.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No entries</p>}
              {data.outgo_by_destination.map((r) => (
                <div className="mgmt-breakdown-item" key={r.name}>
                  <span>{r.name}</span>
                  <span>{fmt(r.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
