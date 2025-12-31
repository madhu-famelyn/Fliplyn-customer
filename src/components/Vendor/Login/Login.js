import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

import logo from "../../../Assets/VendorAssets/Logo.png";
import vendorImage from "../../../Assets/VendorAssets/Vendor Login Image.png";

export default function VendorLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loginUser } = useVendorAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://admin-aged-field-2794.fly.dev/vendors/auth/login",
        {
          phone_number: phoneNumber,
          password,
        }
      );

      const data = res.data;

      loginUser(
        data.access_token,
        data.vendor_id,
        "vendor",
        data.vendor_phone,
        data.stall_ids || [],
        data.vendor_name
      );

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
      setLoading(false);
    }
  };

  return (
    <div className="vendor-login-wrapper">
      {/* LEFT */}
      <div className="vendor-login-left">
        <img src={logo} alt="Fliplyn Logo" className="vendor-logo" />

        <img
          src={vendorImage}
          alt="Vendor Login"
          className="vendor-illustration"
        />

        <h1>Smart. Fast. Empowered.</h1>
        <p>Manage your Fliplyn Vendor workspace with confidence.</p>

        <footer>©2025 Fliplyn Vendor Portal · Secure Access</footer>
      </div>

      {/* RIGHT */}
      <div className="vendor-login-right">
        <form className="vendor-login-card" onSubmit={handleLogin}>
          <h2>Vendor Sign In</h2>
          <p className="desc">Sign in to manage outlets and orders.</p>

          {error && <div className="vendor-error">{error}</div>}

          <div className="field">
            <label>Phone number</label>
            <input
              type="text"
              placeholder="+91 9392977592"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button disabled={loading}>
            {loading ? <div className="loader"></div> : "Sign in"}
          </button>

          <p className="contact">
            Need access? <span>Contact admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}
