import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import {
  getOutgoDestinations, createOutgoEntry, getOutgoEntries, deleteOutgoEntry,
} from "./Service";
import "./Management.css";

export default function OutgoForm() {
  const { token, logout } = useManagementAuth();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    destination_id: "",
    is_gst: false,
    gross_amount: "",
    gst_amount: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [d, e] = await Promise.all([getOutgoDestinations(token), getOutgoEntries(token)]);
    setDestinations(d);
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
  const gstVal = form.is_gst ? (parseFloat(form.gst_amount) || 0) : 0;
  const netAmount = Math.max(0, grossVal - gstVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.destination_id) { setError("Please select an outgo destination."); return; }
    if (grossVal <= 0) { setError("Please enter a valid Gross Amount."); return; }

    setSaving(true);
    try {
      await createOutgoEntry(token, {
        date: form.date,
        destination_id: form.destination_id,
        is_gst: form.is_gst,
        gross_amount: grossVal,
        gst_amount: gstVal,
        net_amount: netAmount,
        amount: netAmount,
        description: form.description,
      });
      setSuccess("Outgo entry saved.");
      setForm((f) => ({
        ...f,
        gross_amount: "",
        gst_amount: "",
        description: "",
        destination_id: "",
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
      await deleteOutgoEntry(token, id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete entry.");
      loadData();
    }
  };

  return (
    <div className="mgmt-page">
      <div className="mgmt-topbar">
        <h1>Outgo Entry</h1>
        <button className="mgmt-btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div className="mgmt-nav">
        <Link to="/management/dashboard">Dashboard</Link>
        <Link to="/management/income">+ Income</Link>
        <Link to="/management/outgo" className="active">+ Outgo</Link>
        <Link to="/management/report">Full Report</Link>
        <Link to="/management/settings">Manage Dropdowns</Link>
      </div>

      <div className="mgmt-card" style={{ maxWidth: 580 }}>
        <h3>Record Expense</h3>
        {error && <div className="mgmt-error">{error}</div>}
        {success && <div className="mgmt-success">{success}</div>}

        <form onSubmit={handleSubmit} className="mgmt-form">
          <div className="mgmt-field">
            <label>Date</label>
            <input type="date" required value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
          </div>

          <div className="mgmt-field">
            <label>Outgo To</label>
            <select required value={form.destination_id} onChange={(e) => handleChange("destination_id", e.target.value)}>
              <option value="">Select destination...</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
              <label>GST Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.gst_amount}
                onChange={(e) => handleChange("gst_amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Auto-calculated Net Amount */}
          <div className="mgmt-field mgmt-net-box">
            <label>Net Expense (Gross - GST)</label>
            <div className="mgmt-net-display">
              ₹{netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="mgmt-field">
            <label>Description (optional)</label>
            <textarea rows={2} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Notes..." />
          </div>

          <button type="submit" className="mgmt-btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Expense"}</button>
        </form>
      </div>

      {/* Recent entries */}
      <div className="mgmt-card">
        <h3>Recent Outgo Entries</h3>
        <div className="mgmt-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>To</th>
                <th>GST</th>
                <th>Gross</th>
                <th>GST Amt</th>
                <th>Net Expense</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#9ca3af" }}>No entries yet</td></tr>}
              {entries.map((e) => {
                const gross = Number(e.gross_amount || e.amount || 0);
                const gst = Number(e.gst_amount || 0);
                const net = Number(e.net_amount || (gross - gst));
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.destination_name}</td>
                    <td>
                      <span className={`mgmt-badge ${e.is_gst ? "badge-gst-yes" : "badge-gst-no"}`}>
                        {e.is_gst ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>₹{gross.toLocaleString("en-IN")}</td>
                    <td>₹{gst.toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: 700, color: "#dc2626" }}>₹{net.toLocaleString("en-IN")}</td>
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
