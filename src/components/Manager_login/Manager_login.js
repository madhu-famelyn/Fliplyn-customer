// 📁 src/pages/manager_login.js
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
    try {
      const data = await loginManager({ email, password });
      loginUser(data.access_token, data.user.email, data.user.id, 'manager');
      navigate('/dashboard');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="manager-login-wrapper">
      <div className="manager-login-card">
        <h2 className="manager-login-title">Manager Login</h2>
        <form onSubmit={handleLogin} className="manager-login-form">
          <div className="manager-login-field">
            <label>Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
            />
          </div>

          <div className="manager-login-field">
            <label>Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="manager-login-button">Login</button>
          {message && <p className="manager-login-error">{message}</p>}
        </form>
      </div>
    </div>
  );
}
