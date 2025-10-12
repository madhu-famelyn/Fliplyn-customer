import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaBoxOpen,
  FaStore,
  FaWallet,
  FaBars,
  FaTimes,
  FaUserPlus,
} from 'react-icons/fa';
import { MdGroupAdd } from 'react-icons/md';
import { RiFileList2Line } from 'react-icons/ri';
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
          Fliplyn<br /><span>Admin Panel</span>
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
                  <FaBoxOpen /> Items
                </Link>
              </li>

              <li>
                <Link to="/stalls" onClick={toggleSidebar}>
                  <FaStore /> Stalls
                </Link>
              </li>

              <li>
                <Link to="/add-money" onClick={toggleSidebar}>
                  <FaWallet /> Add Wallets
                </Link>
              </li>

              <li>
                <Link to="/create-group" onClick={toggleSidebar}>
                  <MdGroupAdd /> Wallet Groups
                </Link>
              </li>

              <li>
                <Link to="/user-creation" onClick={toggleSidebar}>
                  <FaUserPlus /> Create Users
                </Link>
              </li>

        
                    <li>
                <Link to="/manager-wallet" onClick={toggleSidebar}>
                  <RiFileList2Line /> manager wallet
                </Link>
              </li>
                  <li>
                <Link to="/stalls-report-admin" onClick={toggleSidebar}>
                  <RiFileList2Line /> stalls report
                </Link>
              </li>

              <li className="menu-separator"></li>

              {/* Admin Info */}

            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{children}</main>
    </div>
  );
}
