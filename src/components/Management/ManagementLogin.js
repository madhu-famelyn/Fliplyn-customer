import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useManagementAuth } from "../AuthContex/ManagementContext";
import { mgmtLogin } from "./Service";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../Assets/ManagerAssets/Logo.png";
import vendorImage from "../../Assets/ManagerAssets/Manager login Image.png";
import "../Manager_login/Manager_login.css";
import "./Management.css";

export default function ManagementLogin() {
  const { login } = useManagementAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await mgmtLogin({ email, password });
      login(data.access_token, data.user);
      navigate("/management/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-login-container">
      {/* LEFT SECTION */}
      <div className="manager-login-left">
        <div className="brand">
          <img src={logo} alt="Fliplyn Logo" className="brand-logo" />
        </div>

        <div className="illustration">
          <img src={vendorImage} alt="Management Login" />
        </div>

        <h1 className="tagline">Analyze. Control. Grow.</h1>
        <p className="subtitle">
          Real-time income, expenses & business health tracking.<br />
          Access complete ledger reports and manage financial operations in one place.
        </p>

        <footer>©2025 Fliplyn Management Portal · Secure Access</footer>
      </div>

      {/* RIGHT SECTION */}
      <div className="manager-login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Management Portal</h2>
          <p className="login-desc">
            Sign in to check business health and performance.
          </p>

          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="management@fliplyn.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {error && <div className="mgmt-error">{error}</div>}

          <button className="signin-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="contact-admin">
            Need access? <span>Contact admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}

