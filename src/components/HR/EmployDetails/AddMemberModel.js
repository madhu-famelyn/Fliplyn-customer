// src/components/Employees/AddMemberModal.js
import React, { useState } from "react";
import axios from "axios";
import "./AddMemberModal.css";

const API_BASE = "http://127.0.0.1:8000";

const AddMemberModal = ({ groupId, token, onClose, onMemberAdded }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE}/wallet-group/add-member`,
        {
          group_id: groupId,
          name,
          email,
          mobile_number: mobileNumber,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onMemberAdded(response.data.wallet_group);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add Member Manually</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />
          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
