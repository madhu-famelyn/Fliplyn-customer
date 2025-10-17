import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import "./ChangeVendorPassword.css";

export default function ChangeVendorPassword() {
  const { adminId, token } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch vendors on mount
  useEffect(() => {
    if (!adminId) return;

    const fetchVendors = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/vendors/by-admin/${adminId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              Accept: "application/json",
            },
          }
        );
        setVendors(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch vendors.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [adminId, token]);

  const handleUpdatePassword = async () => {
    if (!selectedVendorId) {
      setError("Please select a vendor.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.put(
        "https://admin-aged-field-2794.fly.dev/password/admin/change-password/",
        {
          identifier: selectedVendorId,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200) {
        setMessage(res.data.message || "Password updated successfully");
        setNewPassword("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to update password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-pass-page">
      <h2 className="vendor-pass-title">Change Vendor Password</h2>

      {loading && <p>Loading...</p>}

      {vendors.length > 0 ? (
        <div className="vendor-pass-form">
          <label htmlFor="vendorSelect">Select Vendor</label>
          <select
            id="vendorSelect"
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
          >
            <option value="">-- Select Vendor --</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.phone_number})
              </option>
            ))}
          </select>

          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <p>No vendors found.</p>
      )}
    </div>
  );
}
