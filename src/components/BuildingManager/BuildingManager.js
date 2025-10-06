import React, { useState } from "react";
import axios from "axios";
import { useBuildingManagerAuth } from "../AuthContex/BuildingManagerContext";
import { useNavigate } from "react-router-dom";
import "./BuildingManager.css";

const BuildingManagerLogin = () => {
  const auth = useBuildingManagerAuth();
  const navigate = useNavigate();

  // Hooks must be at the top
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!auth) {
    console.error("BuildingManagerAuth context not found! Wrap the component with BuildingManagerProvider.");
    return null;
  }

  const { login } = auth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(
        "http://localhost:8000/api/building-managers/login",
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token, building_id } = response.data;

      if (!access_token || !building_id) {
        throw new Error("Invalid login response");
      }

      login({ building_id }, access_token);

      navigate("/bld-mng-report");
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bm-login-container">
      <form className="bm-login-form" onSubmit={handleSubmit}>
        <h2 className="bm-login-title">Building Manager Login</h2>

        <div className="bm-form-group">
          <label className="bm-label">Email:</label>
          <input
            className="bm-input"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter email"
          />
        </div>

        <div className="bm-form-group">
          <label className="bm-label">Password:</label>
          <input
            className="bm-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
          />
        </div>

        {error && <p className="bm-error">{error}</p>}

        <button className="bm-login-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};


export default BuildingManagerLogin;
