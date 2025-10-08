import React, { useState } from 'react';
import { loginManager } from './Service';
import { useAuth } from '../AuthContex/ContextAPI';
import { useNavigate } from 'react-router-dom';
import './Manager_login.css';

export default function ManagerLogin() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🔹 Manager login attempt:", { email, password });

    try {
      // ✅ send correct keys
      const data = await loginManager({ email, password });

      console.log("✅ Login response:", data);

      loginUser(data.access_token, data.user, "manager");
      navigate("/manager-stalls");

    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);

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
    }
  };

  return (
    <div className="ml-wrapper">
      <div className="ml-card">
        <h2 className="ml-title">Manager Login</h2>
        <form onSubmit={handleLogin} className="ml-form">
          <div className="ml-field">
            <label>Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
              className="ml-input"
            />
          </div>

          <div className="ml-field">
            <label>Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="ml-input"
            />
          </div>

          <button type="submit" className="ml-btn">Login</button>
          {message && <p className="ml-error">{message}</p>}
        </form>
      </div>
    </div>
  );
}
