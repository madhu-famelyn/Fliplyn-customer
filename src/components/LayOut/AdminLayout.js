// src/components/AdminLayout.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaBuilding, FaStore, FaShoppingCart,
  FaChartBar, FaUsers, FaSignOutAlt, FaBars, FaTimes
} from 'react-icons/fa';
import { GiToken } from 'react-icons/gi';  
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="admin-layout">
      <button className="hamburger" onClick={toggleSidebar}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">🍽️ FoodCourt<br /><span>Admin Panel</span></div>
        <nav className="nav-menu">
          <ul>
            <li><Link to="/locations" onClick={toggleSidebar}><FaMapMarkerAlt /> Locations</Link></li>
            <li><Link to="/items-admin" onClick={toggleSidebar}><FaBuilding /> Items</Link></li>
            <li><Link to="/stalls" onClick={toggleSidebar}><FaStore /> Stalls</Link></li>
            {/* <li><Link to="/manager-stalls" onClick={toggleSidebar}><FaUtensils /> Manegar stalls</Link></li> */}
            <li><Link to="/add-money" onClick={toggleSidebar}><FaShoppingCart /> Add wallets</Link></li>
            <li><Link to="/create-group" onClick={toggleSidebar}><FaShoppingCart /> Add wallets in Group</Link></li>
            <li><Link to="/manager-details" onClick={toggleSidebar}><FaChartBar /> Manager Details</Link></li>
            <li><Link to="/user" onClick={toggleSidebar}><FaUsers /> Users</Link></li>
            <li><Link to="/token" onClick={toggleSidebar}><GiToken/>Token</Link></li>
            <li><Link to="/get-order-email" onClick={toggleSidebar}><GiToken/>Get Order</Link></li>



            <li className="menu-separator"></li>

            <li className="admin-info">
              <div className="user-circle">A</div>
              <div>
                <strong>Admin User</strong><br />
                <small>Super Admin</small>
              </div>
            </li>
            <li><button className="logout-btn"><FaSignOutAlt /> Logout</button></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
