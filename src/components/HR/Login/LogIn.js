import React, { useState } from "react";
import { hrLogin } from "./Servuce";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import { useHrAuth } from "../../AuthContex/HrContext";
import { useNavigate } from "react-router-dom"; // ✅ import navigation
import "./LogIn.css";

const HrLogin = () => {
  const { login } = useHrAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ initialize

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await hrLogin(formData);

      // ✅ Save HR info + token in Context + LocalStorage
      login(data.hr, data.access_token);

      console.log("Login success:", data);

      // ✅ Navigate to HR Dashboard after login
      navigate("/hr-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TokenHeader />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-card">
          <h2 className="login-title">HR Login</h2>

          {error && <p className="error-text">{error}</p>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HrLogin;
