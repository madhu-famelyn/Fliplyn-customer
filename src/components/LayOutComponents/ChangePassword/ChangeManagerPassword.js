import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import "./ChangeManagerPassword.css";

export default function ChangeOMPassword() {
  const { adminId } = useAuth(); // Get adminId from context
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch buildings by adminId
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!adminId) {
        setError("Admin ID missing. Please re-login as admin.");
        return;
      }
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`
        );
        setBuildings(res.data || []);
      } catch (err) {
        console.error("Error fetching buildings:", err.response || err.message);
        setError("Failed to fetch buildings.");
      }
    };
    fetchBuildings();
  }, [adminId]);

  // Fetch managers for selected building
  const handleBuildingChange = async (e) => {
    const buildingId = e.target.value;
    setSelectedBuilding(buildingId);
    setManagers([]);
    setSelectedManager("");
    setMessage(null);
    setError(null);

    if (!buildingId) return;

    try {
      const res = await axios.get(
        `https://admin-aged-field-2794.fly.dev/managers/building/${buildingId}`
      );
      setManagers(res.data || []);
    } catch (err) {
      console.error("Error fetching managers:", err.response || err.message);
      setError("Failed to fetch managers for this building.");
    }
  };

  // Handle password update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!selectedManager || !newPassword) {
      setError("Please select a manager and enter a new password.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.put(
        "https://admin-aged-field-2794.fly.dev/password/admin/change-password/",
        {
          identifier: selectedManager,
          new_password: newPassword,
        }
      );
      if (res.status === 200) {
        setMessage(res.data.message || "Password updated successfully.");
        setNewPassword("");
        setSelectedManager("");
      }
    } catch (err) {
      console.error("Error changing OM password:", err.response || err.message);
      setError(
        err.response?.data?.detail || "Something went wrong while changing password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-wrapper">
      <h2>Change OM Password</h2>

      <form className="change-password-form" onSubmit={handleSubmit}>
        {/* Select Building */}
        <label>Select Building</label>
        <select value={selectedBuilding} onChange={handleBuildingChange}>
          <option value="">-- Select Building --</option>
          {buildings.length > 0
            ? buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name || b.user_name || "Unnamed Building"}
                </option>
              ))
            : <option disabled>No buildings found</option>}
        </select>

        {/* Select Manager */}
        <label>Select Manager</label>
        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          disabled={!selectedBuilding}
        >
          <option value="">-- Select Manager --</option>
          {managers.length > 0
            ? managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))
            : <option disabled>No managers found</option>}
        </select>

        {/* New Password */}
        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Change Password"}
        </button>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}
