import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSelection.css";

export default function LoginSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="login-selection-container">
      <div className="login-box">
        <h1 className="login-title">Select Login Type</h1>

        <button
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          Login as Admin
        </button>

        <button
          className="login-btn"
          onClick={() => navigate("/manager-login")}
        >
          Login as Operational Manager
        </button>

        <button
          className="login-btn"
          onClick={() => navigate("/hr")}
        >
          Login as HR
        </button>

        <button
          className="login-btn"
          onClick={() => navigate("/vendor")}
        >
          Login as Vendor
        </button>

        <button
          className="login-btn"
          onClick={() => navigate("/bld-mng")}
        >
          Login as Building Manager
        </button>
      </div>
    </div>
  );
}
