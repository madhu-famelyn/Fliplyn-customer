import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import {
  getIncomeSources, createIncomeEntry, getIncomeEntries, deleteIncomeEntry,
} from "./Service";
import "./Management.css";

const ACCOUNT_OPTIONS = ["neos", "personal"];

export default function IncomeForm() {
  const { token } = useManagementAuth();
  const navigate = useNavigate();

  const [sources, setSources] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source_id: "",
    amount: "",
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

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.source_id) { setError("Please select an income source."); return; }
    setSaving(true);
    try {
      await createIncomeEntry(token, { ...form, amount: parseFloat(form.amount) });
      setSuccess("Income entry saved.");
      setForm((f) => ({ ...f, amount: "", description: "", source_id: "" }));
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
        <button className="mgmt-btn-secondary" onClick={() => navigate("/manager-stalls")}>Back to OM Dashboard</button>
      </div>

      <div className="mgmt-nav">
        <Link to="/management/dashboard">Dashboard</Link>
        <Link to="/management/income" className="active">+ Income</Link>
        <Link to="/management/outgo">+ Outgo</Link>
        <Link to="/management/report">Full Report</Link>
        <Link to="/management/settings">Manage Dropdowns</Link>
      </div>

      <div className="mgmt-card" style={{ maxWidth: 560 }}>
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
          <div className="mgmt-field">
            <label>Amount (₹)</label>
            <input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="0.00" />
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
                <th>Date</th><th>Source</th><th>Amount</th><th>Account</th><th>Description</th><th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af" }}>No entries yet</td></tr>}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.source_name}</td>
                  <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{Number(e.amount).toLocaleString("en-IN")}</td>
                  <td style={{ textTransform: "capitalize" }}>{e.account_name}</td>
                  <td>{e.description || "—"}</td>
                  <td><button className="mgmt-btn-danger" onClick={() => handleDelete(e.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
