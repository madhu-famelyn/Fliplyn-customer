import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Import the xlsx library for Excel export
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
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [missingUsers, setMissingUsers] = useState([]); // Track missing users

  const adminId = localStorage.getItem("userId") || localStorage.getItem("admin_id");
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!adminId) return;

      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/buildings/buildings/by-admin/${adminId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBuildings(res.data);
      } catch (err) {
        console.error("Failed to fetch buildings:", err);
      }
    };

    if (adminId && token) {
      fetchBuildings();
    }
  }, [adminId, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload an Excel file");
      return;
    }

    const form = new FormData();
    for (const key in formData) {
      form.append(key, formData[key]);
    }
    form.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/wallet-group/upload-excel/",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(response.data.message || "Group created successfully.");
      onGroupCreated(); // reload groups after creation
    } catch (error) {
      const errMsg = error.response?.data?.detail || "Upload failed.";
      setMessage(`Error: ${errMsg}`);

      // If users are not found, we capture them here
      if (error.response?.data?.detail.includes("User with email")) {
        const missingUserEmail = error.response?.data?.detail.split(' ')[4]; // Extract email
        setMissingUsers((prev) => [...prev, { email: missingUserEmail }]);
      }
    }
  };

  // Download missing users as an Excel file
  const downloadMissingUsers = () => {
    if (missingUsers.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(missingUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missing Users");

    // Export file with "Missing_Users" name
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
            <option value="" disabled>
              Select Building
            </option>
           {buildings.map((building) => (
  <option key={building.id} value={building.id}>
    {building.building_name || "Unnamed Building"}  {/* Update this to building.building_name */}
  </option>
))}

          </select>
        </label>

        <input
          type="text"
          name="group_name"
          placeholder="Group Name"
          value={formData.group_name}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="wallet_amount"
          placeholder="Wallet Amount"
          value={formData.wallet_amount}
          onChange={handleChange}
          required
        />

        <label>
          <input
            type="checkbox"
            name="carry_forward"
            checked={formData.carry_forward}
            onChange={handleChange}
          />
          Carry Forward
        </label>

        <label>
          <input
            type="checkbox"
            name="exclude_weekend"
            checked={formData.exclude_weekend}
            onChange={handleChange}
          />
          Exclude Weekend
        </label>

        <label>
          <input
            type="checkbox"
            name="daily_wallet"
            checked={formData.daily_wallet}
            onChange={handleChange}
          />
          Daily Wallet
        </label>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          required
        />

        <button type="submit">Create Group</button>
      </form>

      {message && (
        <p className={`message ${message.startsWith("Error") ? "error" : "success"}`}>
          {message}
        </p>
      )}

      {missingUsers.length > 0 && (
        <div>
          <button onClick={downloadMissingUsers}>
            Download Missing Users
          </button>
        </div>
      )}
    </div>
  );
}
