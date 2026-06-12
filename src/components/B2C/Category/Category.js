import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Category.css";
import CategoryList from "./CategoryList";
import ItemList from "../Items/ItemList";
import { FiShoppingCart, FiGrid, FiChevronUp, FiChevronLeft, FiHome, FiSearch } from "react-icons/fi";

const BASE_URL = "https://admin-aged-field-2794.fly.dev";

export default function B2CCategory() {
  const { stallId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [stallDetails, setStallDetails] = useState(null);
  const [, setItemCount] = useState(0);

  // 🔹 Default = ALL ITEMS
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  const [items, setItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [, setAllItems] = useState([]);

  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [logoError, setLogoError] = useState(false);

  // ================= CART COUNT & ITEMS =================
  const loadLocalCart = () => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
      setCartItems(storedCart);
      const total = storedCart.reduce((sum, i) => sum + (i.quantity || 1), 0);
      setCartCount(total);
    } catch {
      setCartItems([]);
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadLocalCart();
    window.addEventListener("storage", loadLocalCart);
    window.addEventListener("b2c-cart-updated", loadLocalCart);

    return () => {
      window.removeEventListener("storage", loadLocalCart);
      window.removeEventListener("b2c-cart-updated", loadLocalCart);
    };
  }, []);

  const handleClearCart = () => {
    localStorage.removeItem("b2c_cartItems");
    window.dispatchEvent(new Event("b2c-cart-updated"));
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return total.toFixed(2);
  };

  // ================= LOAD CATEGORIES + STALL + ALL ITEMS =================
  useEffect(() => {
    if (!stallId) return;

    axios
      .get(`${BASE_URL}/categories/stall/${stallId}`)
      .then((res) => {
        const updatedCategories = [
          {
            id: "ALL",
            name: "All Items",
            icon: <FiGrid size={18} color="#f97316" />, // orange
          },
          ...res.data,
        ];

        setCategories(updatedCategories);
      })
      .catch((err) => console.error("❌ Error fetching categories:", err));

    axios
      .get(`${BASE_URL}/stalls/${stallId}`)
      .then((res) => setStallDetails(res.data))
      .catch((err) => console.error("❌ Error fetching stall:", err));

    // 🔹 Load all items initially
    axios
      .get(`${BASE_URL}/items/stall/${stallId}`)
      .then((res) => {
        setAllItems(res.data);
        setItems(res.data);
        setItemCount(res.data.length);
        setItemsLoaded(true);
      })
      .catch((err) => {
        console.error("❌ Error fetching all items:", err);
        setItems([]);
        setItemsLoaded(true);
      });
  }, [stallId]);

  // ================= LOAD ITEMS BASED ON CATEGORY =================
  useEffect(() => {
    if (!stallId || !selectedCategoryId) return;

    setItems([]);
    setItemsLoaded(false);

    // 🔹 ALL ITEMS
    if (selectedCategoryId === "ALL") {
      axios
        .get(`${BASE_URL}/items/stall/${stallId}`)
        .then((res) => {
          setItems(res.data);
          setItemsLoaded(true);
        })
        .catch(() => {
          setItems([]);
          setItemsLoaded(true);
        });
      return;
    }

    // 🔹 CATEGORY ITEMS
    axios
      .get(
        `${BASE_URL}/items/items/category/${selectedCategoryId}/availability?is_available=true`
      )
      .then((res) => {
        setItems(res.data);
        setItemsLoaded(true);
      })
      .catch(() => {
        setItems([]);
        setItemsLoaded(true);
      });
  }, [selectedCategoryId, stallId]);

  const handleCategoryClick = (id) => {
    setSelectedCategoryId(id);
  };

  // ================= SIDEBAR OPEN STATE =================
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (stallDetails && !stallDetails.is_available) {
    return (
      <div className="category-page-container">
        <div className="b2c-category-header">
          <div className="b2c-category-header-left">
            <button className="b2c-header-back-btn" onClick={() => navigate("/b2c/stalls")}>
              <FiChevronLeft size={24} color="#1e293b" />
            </button>
            {!logoError && stallDetails?.image_url ? (
              <img
                src={stallDetails.image_url}
                alt={stallDetails.name || "Stall Logo"}
                className="b2c-header-stall-logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="b2c-header-logo-fallback">
                <span>{stallDetails?.name ? stallDetails.name.slice(0, 1).toUpperCase() : "🏪"}</span>
              </div>
            )}
          </div>
          <div className="b2c-category-header-center">
            <h2 className="menu-title" style={{ fontSize: '18px' }}>{stallDetails.name}</h2>
          </div>
          <div className="b2c-category-header-right">
            <button className="b2c-header-home-btn" onClick={() => navigate("/b2c/stalls")}>
              <FiHome size={20} color="#1e293b" />
            </button>
          </div>
        </div>

        <div className="category-wrapper outlet-closed-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px', marginTop: '80px' }}>
          <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '48px 32px', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '72px', display: 'block', marginBottom: '24px' }}>🏪</span>
            <h2 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.5px' }}>{stallDetails.name} is Closed</h2>
            <p style={{ color: '#4b5563', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>This outlet is currently closed by the manager. Please explore other open outlets to place your order.</p>
            <button className="primary-btn" onClick={() => navigate("/b2c/stalls")} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.45)', transition: 'all 0.3s ease' }}>Explore Outlets</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page-container">
      {/* Custom Category Header */}
      <div className="b2c-category-header">
        <div className="b2c-category-header-left">
          <button className="b2c-header-back-btn" onClick={() => navigate("/b2c/stalls")}>
            <FiChevronLeft size={24} color="#1e293b" />
          </button>
          {!logoError && stallDetails?.image_url ? (
            <img
              src={stallDetails.image_url}
              alt={stallDetails.name || "Stall Logo"}
              className="b2c-header-stall-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="b2c-header-logo-fallback">
              <span>{stallDetails?.name ? stallDetails.name.slice(0, 1).toUpperCase() : "🏪"}</span>
            </div>
          )}
        </div>

        <div className="b2c-category-header-center">
          <div className="b2c-header-search-container">
            <FiSearch className="b2c-header-search-icon" size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="b2c-header-search-input"
            />
          </div>
        </div>

        <div className="b2c-category-header-right">
          <button className="b2c-header-home-btn" onClick={() => navigate("/b2c/stalls")}>
            <FiHome size={20} color="#1e293b" />
          </button>
        </div>
      </div>

      <div className="category-wrapper">
        {/* LEFT: CATEGORY SIDEBAR */}
        <CategoryList
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryClick={handleCategoryClick}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* RIGHT: ITEMS AREA */}
        <div 
          className={`items-section-main ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
          style={{ paddingBottom: cartItems.length > 0 ? "110px" : "32px" }}
        >
          {/* Header */}
          <div className="menu-header">
            <h2 className="menu-title">Menu</h2>
          </div>

          {/* Item List */}
          <ItemList 
            items={items} 
            itemsLoaded={itemsLoaded} 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>
      </div>

      {cartItems.length > 0 && (
        <div className="b2c-bottom-cart-bar">
          <div className="b2c-bottom-cart-left" onClick={() => navigate("/b2c/cart")}>
            <div className="b2c-bottom-cart-icon-circle">
              <FiShoppingCart size={20} color="#4f46e5" />
            </div>
            <div className="b2c-bottom-cart-info">
              <span className="b2c-bottom-cart-title">CART</span>
              <span className="b2c-bottom-cart-count">
                {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
              </span>
            </div>
            {cartItems[0] && (
              <div className="b2c-bottom-cart-preview-container">
                <img
                  src={cartItems[0].image_url}
                  alt={cartItems[0].name}
                  className="b2c-bottom-cart-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' style='background:%23f8fafc;width:100%25;height:100%25;'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                  }}
                />
                <button className="b2c-bottom-cart-expand-btn">
                  <FiChevronUp size={16} color="#4b5563" />
                </button>
              </div>
            )}
          </div>

          <div className="b2c-bottom-cart-center">
            <button className="b2c-bottom-cart-clear-btn" onClick={handleClearCart}>
              Clear Cart
            </button>
          </div>

          <div className="b2c-bottom-cart-right">
            <button className="b2c-bottom-cart-checkout-btn" onClick={() => navigate("/b2c/cart")}>
              <span className="checkout-text">CHECKOUT</span>
              <span className="checkout-total">₹{getCartTotal()}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
