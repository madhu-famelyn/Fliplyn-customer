import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import {
  getIncomeSources, addIncomeSource, deleteIncomeSource,
  getOutgoDestinations, addOutgoDestination, deleteOutgoDestination,
} from "./Service";
import "./Management.css";

export default function DropdownSettings() {
  const { token } = useManagementAuth();
  const navigate = useNavigate();

  const [sources, setSources] = useState([]);
  const [dests, setDests] = useState([]);
  const [newSource, setNewSource] = useState("");
  const [newDest, setNewDest] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [s, d] = await Promise.all([getIncomeSources(token), getOutgoDestinations(token)]);
    setSources(s);
    setDests(d);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!newSource.trim()) return;
    setError("");
    try { await addIncomeSource(token, { name: newSource.trim() }); setNewSource(""); load(); }
    catch (err) { setError(err.response?.data?.detail || "Failed to add source"); }
  };

  const handleAddDest = async (e) => {
    e.preventDefault();
    if (!newDest.trim()) return;
    setError("");
    try { await addOutgoDestination(token, { name: newDest.trim() }); setNewDest(""); load(); }
    catch (err) { setError(err.response?.data?.detail || "Failed to add destination"); }
  };

  const handleDeleteSource = async (id) => {
    setError("");
    setSources((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteIncomeSource(token, id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete income source");
      load();
    }
  };

  const handleDeleteDest = async (id) => {
    setError("");
    setDests((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteOutgoDestination(token, id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete outgo destination");
      load();
    }
  };

  return (
    <div className="mgmt-page">
      <div className="mgmt-topbar">
        <h1>Manage Dropdowns</h1>
        <button className="mgmt-btn-secondary" onClick={() => navigate("/manager-stalls")}>Back to OM Dashboard</button>
      </div>

      <div className="mgmt-nav">
        <Link to="/management/dashboard">Dashboard</Link>
        <Link to="/management/income">+ Income</Link>
        <Link to="/management/outgo">+ Outgo</Link>
        <Link to="/management/report">Full Report</Link>
        <Link to="/management/settings" className="active">Manage Dropdowns</Link>
      </div>

      {error && <div className="mgmt-error">{error}</div>}

      <div className="mgmt-breakdown-grid">
        {/* Income Sources */}
        <div className="mgmt-card">
          <h3>Income Sources</h3>
          <form onSubmit={handleAddSource} className="mgmt-inline-form">
            <input
              type="text"
              placeholder="e.g. Kiosk, Events"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
            />
            <button type="submit" className="mgmt-btn-primary" style={{ padding: "8px 16px" }}>Add</button>
          </form>
          <div className="mgmt-tag-list">
            {sources.map((s) => (
              <div className="mgmt-tag" key={s.id}>
                {s.name}
                <button onClick={() => handleDeleteSource(s.id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Outgo Destinations */}
        <div className="mgmt-card">
          <h3>Outgo Destinations</h3>
          <form onSubmit={handleAddDest} className="mgmt-inline-form">
            <input
              type="text"
              placeholder="e.g. Vendor Name, Rent"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
            />
            <button type="submit" className="mgmt-btn-primary" style={{ padding: "8px 16px" }}>Add</button>
          </form>
          <div className="mgmt-tag-list">
            {dests.map((d) => (
              <div className="mgmt-tag" key={d.id}>
                {d.name}
                <button onClick={() => handleDeleteDest(d.id)}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
