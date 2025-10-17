import React from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();

  const options = [
    { key: "admin", label: "Change Admin Password", path: "/change/admin" },
    { key: "user", label: "Change User Password", path: "/change/user" },
    { key: "vendor", label: "Change Vendor Password", path: "/change/vendor" },
    { key: "hr", label: "Change HR Password", path: "/change/hr" },
    { key: "om", label: "Change OM Password", path: "/change/om" },
    {
      key: "manager",
      label: "Change Building Manager Password",
      path: "/change/manager",
    },
  ];

  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <div className="cp-page">
      <header className="cp-header">
        <h1>Change Password</h1>
        <p className="cp-sub">Select which password you want to change</p>
      </header>

      <main className="cp-grid">
        {options.map((opt) => (
          <button
            key={opt.key}
            className="cp-option"
            onClick={() => handleClick(opt.path)}
          >
            <span className="cp-option-title">{opt.label}</span>
            <span className="cp-option-arrow">›</span>
          </button>
        ))}
      </main>
    </div>
  );
}
