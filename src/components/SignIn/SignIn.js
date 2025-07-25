import React, { useState } from 'react';
import './SignIn.css';
import { login } from './sevice';
import { useAuth } from '../AuthContex/ContextAPI';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(email, password);
      const userId = response.user?.id;
      loginUser(response.access_token, email, userId, 'admin');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
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

          <button type="submit" className="signin-button">Sign In</button>
          {error && <p className="signin-error">{error}</p>}
        </form>

        <div className="signin-links">
          <p>Don’t have an account? <Link to="/signup">Sign Up</Link></p>
          <p className="signin-manager-link">
            Want to login as manager? <Link to="/manager-login">Login as Manager</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
