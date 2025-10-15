// src/pages/vendor/VendorLogin.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import "./Login.css";

export default function VendorLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Loader state
  const navigate = useNavigate();
  const { loginUser } = useVendorAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // ✅ Start loader

    try {
      const res = await axios.post("https://admin-aged-field-2794.fly.dev/vendors/auth/login", {
        phone_number: phoneNumber,
        password: password,
      });

      const data = res.data;
      const token = data.access_token;
      const vendorId = data.vendor_id;
      const stallIds = data.stall_ids || [];
      const vendorName = data.vendor_name;
      const vendorPhone = data.vendor_phone;

      loginUser(token, vendorId, "vendor", vendorPhone, stallIds, vendorName);

      setTimeout(() => {
        console.log("=== Local Storage After Login ===");
        console.log("token:", localStorage.getItem("token"));
        console.log("userId:", localStorage.getItem("userId"));
        console.log("role:", localStorage.getItem("role"));
        console.log("vendorPhone:", localStorage.getItem("vendorPhone"));
        console.log("stallIds:", localStorage.getItem("stallIds"));
        console.log("vendorName:", localStorage.getItem("vendorName"));
        console.log("=================================");
      }, 300);

      navigate("/vendor-stall");
    } catch (err) {
      let message = "Login failed. Please try again.";
      const detail = err.response?.data?.detail;

      if (detail) {
        if (Array.isArray(detail)) {
          message = detail.map((d) => d.msg).join(", ");
        } else if (typeof detail === "string") {
          message = detail;
        }
      }

      setError(message);
    } finally {
      setLoading(false); // ✅ Stop loader after request
    }
  };

  return (
    <div>
      <TokenHeader />
      <div className="vendor-login-page">
        <div className="vendor-login-card">
          <h1 className="vendor-login-title">Enter your mobile number</h1>

          {error && <div className="vendor-login-error">{error}</div>}

          <div className="vendor-login-container">
            <form className="vendor-login-form" onSubmit={handleLogin}>
              <div className="vendor-login-field">
                <label className="vendor-login-label">Phone Number</label>
                <input
                  type="text"
                  className="vendor-login-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  required
                  disabled={loading}
                />
              </div>

              <div className="vendor-login-field">
                <label className="vendor-login-label">Password</label>
                <input
                  type="password"
                  className="vendor-login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={`vendor-login-button ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <div className="loader"></div> // ✅ Spinner
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
