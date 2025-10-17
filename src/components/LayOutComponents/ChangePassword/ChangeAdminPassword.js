import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import "./ChangeAdminPassword.css";

export default function ChangeAdminPassword() {
  const { adminId, token } = useAuth(); // get admin ID and token from context
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Optional: show adminId for debug
  useEffect(() => {
    if (!adminId) console.warn("⚠️ Admin ID not found in AuthContext.");
  }, [adminId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!adminId) {
      setMessage("❌ Admin ID not found. Please login again.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.put(
        "https://admin-aged-field-2794.fly.dev/password/admin/change-password/",
        {
          identifier: adminId,
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
        setMessage("✅ Password updated successfully!");
        setNewPassword("");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setMessage(`❌ ${err.response.data.detail}`);
      } else {
        setMessage("❌ Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-pass-page">
      <div className="admin-pass-card">
        <h2 className="admin-pass-title">Change Admin Password</h2>
        <p className="admin-pass-sub">
          Enter your new password below and click update.
        </p>

        <form onSubmit={handleSubmit} className="admin-pass-form">
          <label className="admin-pass-label">New Password</label>
          <input
            type="password"
            className="admin-pass-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />

          <button
            type="submit"
            className="admin-pass-btn"
            disabled={loading || !newPassword}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && <p className="admin-pass-msg">{message}</p>}
      </div>
    </div>
  );
}
