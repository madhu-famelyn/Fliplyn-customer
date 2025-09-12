import React, { useState } from "react";
import {
  Home,
  Users,
  Plus,
  Briefcase,
} from "lucide-react"; 

import "./SideBar.css";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} /> },
    { name: "Report", icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="sidebar">
      <h1 className="logo">Fliplyn</h1>

      <ul className="menu">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={`menu-item ${active === item.name ? "active" : ""}`}
            onClick={() => setActive(item.name)}
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
