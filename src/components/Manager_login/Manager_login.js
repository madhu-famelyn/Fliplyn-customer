import React, { useState } from "react";
import "./Manager_login.css";
import vendorImage from "../../Assets/ManagerAssets/Manager login Image.png";
import logo from "../../Assets/ManagerAssets/Logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginManager } from "./Service";
import { useAuth } from "../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";

export default function ManagerLogin() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await loginManager({ email, password });

      // Save token & user
      loginUser(data.access_token, data.user, "manager");

      navigate("/manager-stalls");
    } catch (error) {
      console.error("Login failed:", error.response || error);

      let msg = "Login failed";

      const detail = error.response?.data?.detail;
      if (detail) {
        if (Array.isArray(detail)) {
          msg = detail.map(d => d.msg || JSON.stringify(d)).join(", ");
        } else if (typeof detail === "string") {
          msg = detail;
        } else {
          msg = JSON.stringify(detail);
        }
      }

      setMessage(msg);
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
          <img src={vendorImage} alt="Vendor Login" />
        </div>

        <h1 className="tagline">Own. Manage. Grow.</h1>
        <p className="subtitle">
          Run your outlets and operations with total control.<br/>
          Access performance, update menus, and manage vendors - all in one place.
        </p>

        <footer>©2025 Fliplyn Vendor Portal · Secure Access</footer>
      </div>

      {/* RIGHT SECTION */}
      <div className="manager-login-right">
        <form className="login-card" onSubmit={handleLogin}>
          <h2>Manager Signin</h2>
          <p className="login-desc">
           Sign in to manage outlets and Performance.
          </p>

          <div className="form-group">
            <label>Email or phone</label>
            <input
              type="text"
              placeholder="vendor@fliplyn.com or +91 9392977592"
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

          {message && <p className="login-error">{message}</p>}

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
