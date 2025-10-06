import React, { useState } from "react";
import { Home, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ import
import "./SideBar.css";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/" },
    { name: "Report", icon: <Briefcase size={18} />, path: "/hr-reports" }, // ✅ path added
  ];

  const handleClick = (item) => {
    setActive(item.name);
    navigate(item.path); // ✅ navigate
  };

  return (
    <div className="sidebar">
      <h1 className="logo">Fliplyn</h1>

      <ul className="menu">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={`menu-item ${active === item.name ? "active" : ""}`}
            onClick={() => handleClick(item)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
