import React from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../LayOut/AdminLayout";
import "./MainPage.css";

export default function UserCreation() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="user-creation-container">
        <h1 className="user-title">User Management</h1>

        <div className="button-group">
          <button
            className="big-button"
            onClick={() => navigate("/view-managers")}
          >
            View Operational Manager
          </button>

          <button
            className="big-button"
            onClick={() => navigate("/view-vendors")}
          >
            View Vendor
          </button>
          <button
            className="big-button"
            onClick={() => navigate("/view-building-managers")}
          >
            View Building Manager
          </button>

          <button
            className="big-button"
            onClick={() => navigate("/change-password")}
          >
            Change Password
          </button>

          <button
            className="big-button"
            onClick={() => navigate("/change-password")}
          >
            Add User
          </button>
          <button
            className="big-button"
            onClick={() => navigate("/change-password")}
          >
            User Deactivate
          </button>

          
        </div>
      </div>
    </AdminLayout>
  );
}

