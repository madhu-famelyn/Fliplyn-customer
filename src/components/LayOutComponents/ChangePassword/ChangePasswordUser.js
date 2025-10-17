// src/pages/admin/UpdateUserPassword.js
import React, { useState } from "react";
import axios from "axios";
import "./ChangePasswordUser.css"; // optional, for styling

export default function UpdateUserPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!email || !newPassword) {
      setError("Please fill in both fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        "https://admin-aged-field-2794.fly.dev/password/admin/change-password/",
        {
          identifier: email,
          new_password: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.status === 200) {
        setMessage(response.data.message || "Password updated successfully.");
        setEmail("");
        setNewPassword("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-wrapper">
      <h2>Update User Password</h2>
      <form className="update-password-form" onSubmit={handleSubmit}>
        <label htmlFor="email">User Email</label>
        <input
          type="email"
          id="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="newPassword">New Password</label>
        <input
          type="password"
          id="newPassword"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}
