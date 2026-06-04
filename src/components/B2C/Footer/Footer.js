import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaShoppingCart, FaSignOutAlt } from "react-icons/fa";
import { useB2CAuth } from "../../AuthContex/B2CContext";
import "./Footer.css";

const B2CFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useB2CAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/b2c-login");
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <div className="footer-container">
        <div
          className={`footer-item ${isActive("/b2c/stalls") ? "active" : ""}`}
          onClick={() => navigate("/b2c/stalls")}
        >
          <FaHome className="footer-icon-react" />
          <span>Home</span>
        </div>

        <div
          className={`footer-item ${isActive("/b2c/cart") ? "active" : ""}`}
          onClick={() => navigate("/b2c/cart")}
        >
          <FaShoppingCart className="footer-icon-react" />
          <span>Basket</span>
        </div>

        <div
          className="footer-item"
          onClick={handleLogoutClick}
        >
          <FaSignOutAlt className="footer-icon-react" />
          <span>Logout</span>
        </div>
      </div>

      {showConfirm && (
        <div className="logout-modal-overlay" onClick={handleCancelLogout}>
          <div className="logout-modal-card" onClick={(e) => e.stopPropagation()}>
            <span className="logout-modal-icon">🚪</span>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your session?</p>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button className="logout-modal-btn confirm" onClick={handleConfirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default B2CFooter;
