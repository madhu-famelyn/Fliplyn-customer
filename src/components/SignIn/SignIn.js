import React, { useState } from "react";
import "./SignIn.css";
import { login } from "./sevice";
import { useAuth } from "../AuthContex/ContextAPI";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);
      console.log("Login API Response:", response);

      let userId = response.user?.id;
      let userRole = response.user?.role || "admin";
      let userPhone = response.user?.phone || null;
      let adminIdFromResponse = response.user?.admin_id || null;

      // Fallback: decode JWT if userId not found
      if (!userId && response.access_token) {
        try {
          const decoded = jwtDecode(response.access_token);
          userId = decoded.sub || decoded.user_id || decoded.id;
          console.log("Decoded JWT:", decoded);
        } catch (decodeErr) {
          console.error("JWT decode failed:", decodeErr);
        }
      }

      if (!userId) throw new Error("No userId found in login response");

      // Save into AuthContext
      loginUser(
        response.access_token,
        email,
        userId,
        userRole,
        userPhone,
        adminIdFromResponse
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <h2 className="signin-heading">Sign In</h2>

        <form onSubmit={handleSignIn} className="signin-form">
          <label>Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password *</label>
          <div className="signin-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="signin-toggle-icon"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="signin-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
          {error && <p className="signin-error">{error}</p>}
        </form>

        <div className="signin-links">
          <p>
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      {loading && (
        <div className="signin-loader-overlay">
          <div className="signin-loader-box">
            <div className="spinner" />
            <p className="signin-loader-text">Please wait, logging you in...</p>
          </div>
        </div>
      )}
    </div>
  );
}
