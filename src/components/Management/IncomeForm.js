import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import {
  getIncomeSources, createIncomeEntry, getIncomeEntries, deleteIncomeEntry,
} from "./Service";
import "./Management.css";

const ACCOUNT_OPTIONS = ["neos", "personal"];

export default function IncomeForm() {
  const { token, logout } = useManagementAuth();
  const navigate = useNavigate();

  const [sources, setSources] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source_id: "",
    is_gst: false,
    gross_amount: "",
    gst_percent: "",
    account_name: "neos",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [s, e] = await Promise.all([getIncomeSources(token), getIncomeEntries(token)]);
    setSources(s);
    setEntries(e);
  };

  useEffect(() => {
    const activeToken = token || localStorage.getItem("mgmtToken") || localStorage.getItem("token");
    if (!activeToken) {
      navigate("/", { replace: true });
      return;
    }
    loadData();
  }, [token, navigate]); // eslint-disable-line

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const grossVal = parseFloat(form.gross_amount) || 0;
  const gstPercent = form.is_gst ? (parseFloat(form.gst_percent) || 0) : 0;
  const gstVal = form.is_gst ? Math.round((grossVal * gstPercent / 100) * 100) / 100 : 0;
  const netAmount = Math.max(0, grossVal - gstVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.source_id) { setError("Please select an income source."); return; }
    if (grossVal <= 0) { setError("Please enter a valid Gross Amount."); return; }

    setSaving(true);
    try {
      await createIncomeEntry(token, {
        date: form.date,
        source_id: form.source_id,
        is_gst: form.is_gst,
        gross_amount: grossVal,
        gst_amount: gstVal,
        net_amount: netAmount,
        amount: netAmount,
        account_name: form.account_name,
        description: form.description,
      });
      setSuccess("Income entry saved.");
      setForm((f) => ({
        ...f,
        gross_amount: "",
        gst_percent: "",
        description: "",
        source_id: "",
        is_gst: false,
      }));
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    setEntries((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteIncomeEntry(token, id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete entry.");
      loadData();
    }
  };

  return (
    <div className="mgmt-page">
      <div className="mgmt-topbar">
        <h1>Income Entry</h1>
        <button className="mgmt-btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div className="mgmt-nav">
        <Link to="/management/dashboard">Dashboard</Link>
        <Link to="/management/income" className="active">+ Income</Link>
        <Link to="/management/outgo">+ Outgo</Link>
        <Link to="/management/report">Full Report</Link>
        <Link to="/management/settings">Manage Dropdowns</Link>
      </div>

      <div className="mgmt-card" style={{ maxWidth: 580 }}>
        <h3>Record Income</h3>
        {error && <div className="mgmt-error">{error}</div>}
        {success && <div className="mgmt-success">{success}</div>}

        <form onSubmit={handleSubmit} className="mgmt-form">
          <div className="mgmt-field">
            <label>Date</label>
            <input type="date" required value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
          </div>

          <div className="mgmt-field">
            <label>Income From</label>
            <select required value={form.source_id} onChange={(e) => handleChange("source_id", e.target.value)}>
              <option value="">Select source...</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* GST Checkbox */}
          <div className="mgmt-checkbox-field">
            <label className="mgmt-checkbox-label">
              <input
                type="checkbox"
                checked={form.is_gst}
                onChange={(e) => handleChange("is_gst", e.target.checked)}
              />
              <span>Is GST Applicable?</span>
            </label>
          </div>

          <div className="mgmt-field">
            <label>Gross Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.gross_amount}
              onChange={(e) => handleChange("gross_amount", e.target.value)}
              placeholder="0.00"
            />
          </div>

          {form.is_gst && (
            <div className="mgmt-field">
              <label>GST % (Percentage)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={form.gst_percent}
                onChange={(e) => handleChange("gst_percent", e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
          )}

          {form.is_gst && grossVal > 0 && (
            <div className="mgmt-field mgmt-net-box" style={{ background: "#fef9c3" }}>
              <label>GST Amount (Auto-calculated)</label>
              <div className="mgmt-net-display" style={{ color: "#b45309" }}>
                ₹{gstVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {/* Auto-calculated Net Amount */}
          <div className="mgmt-field mgmt-net-box">
            <label>Net Amount (Gross - GST)</label>
            <div className="mgmt-net-display">
              ₹{netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="mgmt-field">
            <label>Account Name</label>
            <select required value={form.account_name} onChange={(e) => handleChange("account_name", e.target.value)}>
              {ACCOUNT_OPTIONS.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>

          <div className="mgmt-field">
            <label>Description (optional)</label>
            <textarea rows={2} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Notes..." />
          </div>

          <button type="submit" className="mgmt-btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Income"}</button>
        </form>
      </div>

      {/* Recent entries */}
      <div className="mgmt-card">
        <h3>Recent Income Entries</h3>
        <div className="mgmt-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>GST</th>
                <th>Gross</th>
                <th>GST Amt</th>
                <th>Net Amount</th>
                <th>Account</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "#9ca3af" }}>No entries yet</td></tr>}
              {entries.map((e) => {
                const gross = Number(e.gross_amount || e.amount || 0);
                const gst = Number(e.gst_amount || 0);
                const net = Number(e.net_amount || (gross - gst));
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.source_name}</td>
                    <td>
                      <span className={`mgmt-badge ${e.is_gst ? "badge-gst-yes" : "badge-gst-no"}`}>
                        {e.is_gst ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>₹{gross.toLocaleString("en-IN")}</td>
                    <td>₹{gst.toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{net.toLocaleString("en-IN")}</td>
                    <td style={{ textTransform: "capitalize" }}>{e.account_name}</td>
                    <td>{e.description || "—"}</td>
                    <td><button className="mgmt-btn-danger" onClick={() => handleDelete(e.id)}>Delete</button></td>
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
