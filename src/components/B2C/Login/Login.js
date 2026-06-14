import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { b2cLogin } from "./Service";
import { useB2CAuth } from "../../AuthContex/B2CContext";
import "./Login.css";

const B2CLogin = () => {
  const { login } = useB2CAuth();
  const [formData, setFormData] = useState({ company_email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await b2cLogin(formData);

      // ✅ Save B2C user info + token in Context + LocalStorage
      login(data.user, data.access_token);

      console.log("✅ B2C Login success:", data);

      // ✅ Navigate to stalls page after login
      navigate("/b2c-home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="b2c-login-wrapper">
      <div className="b2c-login-card">
        {/* Badge */}
        <span className="b2c-badge">B2C</span>

        <h2 className="b2c-heading">Welcome Back</h2>
        <p className="b2c-subtext">Sign in to your B2C account</p>

        {error && <p className="b2c-error">{error}</p>}

        <form onSubmit={handleSubmit} className="b2c-form">
          {/* Company Email */}
          <div className="b2c-input-group">
            <label className="b2c-label">Company Email *</label>
            <input
              type="email"
              name="company_email"
              value={formData.company_email}
              onChange={handleChange}
              className="b2c-input"
              placeholder="Enter your company email"
              required
            />
          </div>

          {/* Password */}
          <div className="b2c-input-group">
            <label className="b2c-label">Password *</label>
            <div className="b2c-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="b2c-input"
                placeholder="Enter your password"
                required
              />
              <span
                className="b2c-toggle-icon"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="b2c-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <span className="b2c-back" onClick={() => navigate("/")}>
          ← Back to Login Selection
        </span>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="b2c-loader-overlay">
          <div className="b2c-loader-box">
            <div className="b2c-spinner" />
            <p className="b2c-loader-text">Please wait, logging you in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2CLogin;
