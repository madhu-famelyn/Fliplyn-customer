import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaBox,
  FaStoreAlt,
  FaWallet,
  FaBars,
  FaTimes,
  FaUserPlus,
  FaFileInvoiceDollar,
  FaChartPie,
} from 'react-icons/fa';
import { MdGroups2 } from 'react-icons/md';
import { RiAdminLine } from 'react-icons/ri';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="admin-layout">
      {/* Hamburger for mobile */}
      <button className="hamburger" onClick={toggleSidebar}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          Fliplyn
          <br />
          <span>Admin Panel</span>
        </div>

        <div className="sidebar-scroll">
          <nav className="nav-menu">
            <ul>
              <li>
                <Link to="/locations" onClick={toggleSidebar}>
                  <FaMapMarkerAlt /> Locations
                </Link>
              </li>

              <li>
                <Link to="/items-admin" onClick={toggleSidebar}>
                  <FaBox /> Items
                </Link>
              </li>

              <li>
                <Link to="/stalls" onClick={toggleSidebar}>
                  <FaStoreAlt /> Stalls
                </Link>
              </li>

              <li>
                <Link to="/add-money" onClick={toggleSidebar}>
                  <FaWallet /> Add Wallets
                </Link>
              </li>

              <li>
                <Link to="/create-group" onClick={toggleSidebar}>
                  <MdGroups2 /> Wallet Groups
                </Link>
              </li>

              <li>
                <Link to="/user-creation" onClick={toggleSidebar}>
                  <FaUserPlus /> Create Users
                </Link>
              </li>

              <li>
                <Link to="/manager-wallet" onClick={toggleSidebar}>
                  <FaFileInvoiceDollar /> Manager Wallet
                </Link>
              </li>

              <li>
                <Link to="/stalls-report-admin" onClick={toggleSidebar}>
                  <FaChartPie /> Stalls Report
                </Link>
              </li>

              <li className="menu-separator"></li>

              {/* <li className="admin-info">
                <RiAdminLine /> Admin Dashboard
              </li> */}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{children}</main>
    </div>
  );
}
