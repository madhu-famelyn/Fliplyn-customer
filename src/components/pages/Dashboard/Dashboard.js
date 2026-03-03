import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import AdminLayout from "../../LayOut/AdminLayout";
const PageDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    { title: "Events", path: "/events", desc: "Manage all events" },
    { title: "Clubs", path: "/clubs", desc: "Manage all clubs" },
    { title: "Offers", path: "/offers", desc: "Manage all offers" },
    { title: "Others", path: "/others", desc: "Other configurations" },
  ];

  return (
    <div className="dashboard-layout">
        <AdminLayout/>
    

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome to Fliplyn Admin Panel</p>
        </div>

        <div className="dashboard-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="dashboard-card"
              onClick={() => navigate(card.path)}
            >
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageDashboard;
