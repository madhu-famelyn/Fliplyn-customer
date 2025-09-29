import React, { useState } from 'react';
import './SignIn.css';
import { login } from './sevice';
import { useAuth } from '../AuthContex/AdminContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import jwtDecode from 'jwt-decode';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(email, password);

      console.log("Login API Response:", response); // ✅ debug

      // Get userId from response.user.id or fallback to JWT "sub"
      let userId = response.user?.id;
      if (!userId && response.access_token) {
        const decoded = jwtDecode(response.access_token);
        userId = decoded.sub;
      }

      loginUser(response.access_token, email, userId, 'admin');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
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
              type={showPassword ? 'text' : 'password'}
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          {error && <p className="signin-error">{error}</p>}
        </form>

        <div className="signin-links">
          <p>Don’t have an account? <Link to="/signup">Sign Up</Link></p>
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
