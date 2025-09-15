// src/components/WalletGroups/CreateGroup.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // For Excel export
import { fetchBuildingsByAdminId } from "../Admin-Items/Service";
import "./CreateGroup.css";

export default function CreateGroup({ onGroupCreated }) {
  const [formData, setFormData] = useState({
    building_id: "",
    wallet_amount: "",
    group_name: "",
    carry_forward: false,
    exclude_weekend: false,
    daily_wallet: false,
    days_count: 1,
    payment_method: "prepaid",
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [missingUsers, setMissingUsers] = useState([]);

  const adminId = localStorage.getItem("userId") || localStorage.getItem("admin_id");
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  const API_BASE = import.meta.env.VITE_API_URL; // ✅ Use environment variable

  // Fetch buildings
  useEffect(() => {
    const getBuildings = async () => {
      if (!adminId || !token) return;
      try {
        const data = await fetchBuildingsByAdminId(adminId, token);
        setBuildings(data);
      } catch (err) {
        console.error("Failed to fetch buildings:", err);
      }
    };
    getBuildings();
  }, [adminId, token]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // File selection
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload an Excel file");
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => form.append(key, val));
    form.append("admin_id", adminId);
    form.append("file", file);

    try {
      const response = await axios.post(`${API_BASE}/wallet-group/upload-excel/`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(response.data.message || "Group created successfully.");
      setMissingUsers(response.data.non_registered_users || []);
      onGroupCreated();

      // Reset form
      setFormData({
        building_id: "",
        wallet_amount: "",
        group_name: "",
        carry_forward: false,
        exclude_weekend: false,
        daily_wallet: false,
        days_count: 1,
        payment_method: "prepaid",
      });
      setFile(null);
    } catch (error) {
      const errMsg = error.response?.data?.detail || "Upload failed.";
      setMessage(`Error: ${errMsg}`);
    }
  };

  // Download missing users as Excel
  const downloadMissingUsers = () => {
    if (!missingUsers.length) return;

    const ws = XLSX.utils.json_to_sheet(missingUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missing Users");
    XLSX.writeFile(wb, "Missing_Users.xlsx");
  };

  return (
    <div className="create-group-container">
      <h1>Create Wallet Group</h1>
      <form className="create-group-form" onSubmit={handleSubmit}>
        <label>
          Select Building:
          <select
            name="building_id"
            value={formData.building_id}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.building_name || "Unnamed Building"}</option>
            ))}
          </select>
        </label>

        <input type="text" name="group_name" placeholder="Group Name" value={formData.group_name} onChange={handleChange} required />
        <input type="number" name="wallet_amount" placeholder="Wallet Amount" value={formData.wallet_amount} onChange={handleChange} required />

        <label>
          <input type="checkbox" name="carry_forward" checked={formData.carry_forward} onChange={handleChange} />
          Carry Forward
        </label>

        <label>
          <input type="checkbox" name="exclude_weekend" checked={formData.exclude_weekend} onChange={handleChange} />
          Exclude Weekend
        </label>

        <label>
          <input type="checkbox" name="daily_wallet" checked={formData.daily_wallet} onChange={handleChange} />
          Daily Wallet
        </label>

        <label>
          Days Count:
          <input type="number" name="days_count" value={formData.days_count} onChange={handleChange} min="1" required />
        </label>

        <label>
          Payment Method:
          <select name="payment_method" value={formData.payment_method} onChange={handleChange} required>
            <option value="prepaid">Prepaid</option>
            <option value="postpaid">Postpaid</option>
          </select>
        </label>

        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} required />
        <button type="submit">Create Group</button>
      </form>

      {message && <p className={`message ${message.startsWith("Error") ? "error" : "success"}`}>{message}</p>}

      {missingUsers.length > 0 && (
        <div className="missing-users-section">
          <h3>Missing Users</h3>
          <ul>
            {missingUsers.map((user, idx) => (
              <li key={idx}>{user.name} - {user.email} - {user.mobile_number}</li>
            ))}
          </ul>
          <button onClick={downloadMissingUsers}>Download Missing Users</button>
        </div>
      )}
    </div>
  );
}
