import React, { useState } from 'react';
import './SignUp.css';
import { signUp } from './Service';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      if (!passwordRegex.test(value)) {
        setPasswordError(
          'Password must be 8–12 characters with 1 uppercase letter, 1 digit, and 1 special character.'
        );
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwordError) return;

    try {
      await signUp(formData);
      setSuccess('Registration successful!');
      setFormData({ name: '', email: '', phone_number: '', password: '' });

      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="signup-unique-wrapper">
      <div className="signup-unique-card">
        <h2 className="signup-unique-heading">Create Account</h2>

        <form className="signup-unique-form" onSubmit={handleSubmit}>
          <label>Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
          />

          <label>Email *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
          />

          <label>Phone Number *</label>
          <input
            type="tel"
            name="phone_number"
            required
            pattern="\d{10}"
            value={formData.phone_number}
            onChange={handleChange}
          />

          <label>Password *</label>
          <div className="signup-unique-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <span
              className="signup-unique-toggle-icon"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {passwordError && <p className="signup-unique-error">{passwordError}</p>}

          <button type="submit" className="signup-unique-button">Sign Up</button>
          {success && <p className="signup-unique-success">{success}</p>}
          {error && <p className="signup-unique-error">{error}</p>}
        </form>

        <div className="signup-unique-links">
          Already have an account? <Link to="/">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
