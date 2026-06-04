import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import logo from "../../../Assets/ManagerAssets/Logo.png";
import "./Header.css";

export default function B2CHeader() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = () => {
    try {
      const items = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
      const total = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();
    window.addEventListener("storage", loadCartCount);
    window.addEventListener("b2c-cart-updated", loadCartCount);
    return () => {
      window.removeEventListener("storage", loadCartCount);
      window.removeEventListener("b2c-cart-updated", loadCartCount);
    };
  }, []);

  return (
    <>
      <nav className="simple-header">
        {/* Left: Logo + Brand */}
        <div
          className="header-left"
          onClick={() => navigate("/b2c/stalls")}
        >
          <img src={logo} alt="Fliplyn Logo" className="header-logo" />
          <span className="header-brand"><span className="b2c-header-badge">B2C</span></span>
        </div>

        {/* Right: Cart (No Wallet) */}
        <div className="header-right">
          <div className="cart-icon-wrapper" onClick={() => navigate("/b2c/cart")}>
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </div>
        </div>
      </nav>
      <div className="announcement-banner">
        <div className="announcement-track">
          <span>
            ✅ UPI payment functionality is now available &nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ B2C Ordering Flow: Select items, scan the QR code, and pay using any UPI app.
          </span>
          <span>
            ✅ UPI payment functionality is now available &nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ B2C Ordering Flow: Select items, scan the QR code, and pay using any UPI app.
          </span>
          <span>
            ✅ UPI payment functionality is now available &nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ B2C Ordering Flow: Select items, scan the QR code, and pay using any UPI app.
          </span>
          <span>
            ✅ UPI payment functionality is now available &nbsp;&nbsp;•&nbsp;&nbsp;
            ⚠️ B2C Ordering Flow: Select items, scan the QR code, and pay using any UPI app.
          </span>
        </div>
      </div>
    </>
  );
}
