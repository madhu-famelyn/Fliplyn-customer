import React, { useState } from "react";
import axios from "axios";
import "./DeactiveUser.css"; // optional CSS file

export default function UpdateStatus() {
  const [formData, setFormData] = useState({
    email: "",
    is_active: true, // default to active
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.put(
        "https://admin-aged-field-2794.fly.dev/user/status",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessage(
        `✅ Status updated successfully for ${formData.email} (${formData.is_active ? "Active" : "Inactive"})`
      );
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      setMessage(error.response?.data?.detail || "❌ Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-status-container">
      <h2>Update User Status</h2>

      <form className="update-status-form" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="User Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label className="status-checkbox">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          Active
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Status"}
        </button>
      </form>

      {message && <p className="response-message">{message}</p>}
    </div>
  );
}
