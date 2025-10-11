import React, { useState } from "react";
import { Home, Briefcase, Menu, X } from "lucide-react"; // added menu icons
import { useNavigate } from "react-router-dom";
import "./SideBar.css";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const [isOpen, setIsOpen] = useState(false); // mobile sidebar toggle
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/hr-dashboard" },
  ];

  const handleClick = (item) => {
    setActive(item.name);
    navigate(item.path);
    setIsOpen(false); // auto close sidebar on mobile after click
  };

  return (
    <>
      {/* 🔹 Hamburger Button (Mobile) */}
      <button
        className="menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🔹 Overlay (for mobile when sidebar is open) */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      {/* 🔹 Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <h1 className="logo">Fliplyn</h1>

        <ul className="menu">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={`menu-item ${
                active === item.name ? "active" : ""
              }`}
              onClick={() => handleClick(item)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
