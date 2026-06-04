import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Category.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

import CategoryList from "./CategoryList";
import ItemList from "../Items/ItemList";
import { FiShoppingCart, FiGrid } from "react-icons/fi";

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

  // ================= CART COUNT =================
  const loadLocalCartCount = () => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
      const total = storedCart.reduce((sum, i) => sum + (i.quantity || 1), 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadLocalCartCount();
    window.addEventListener("storage", loadLocalCartCount);
    window.addEventListener("b2c-cart-updated", loadLocalCartCount);

    return () => {
      window.removeEventListener("storage", loadLocalCartCount);
      window.removeEventListener("b2c-cart-updated", loadLocalCartCount);
    };
  }, []);

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
      <div>
        <Header />
        <div className="category-wrapper outlet-closed-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px' }}>
          <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '48px 32px', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '72px', display: 'block', marginBottom: '24px' }}>🏪</span>
            <h2 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.5px' }}>{stallDetails.name} is Closed</h2>
            <p style={{ color: '#4b5563', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>This outlet is currently closed by the manager. Please explore other open outlets to place your order.</p>
            <button className="primary-btn" onClick={() => navigate("/b2c/stalls")} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.45)', transition: 'all 0.3s ease' }}>Explore Outlets</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

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
        <div className={`items-section-main ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
          {/* Header with Cart */}
          <div className="menu-header">
            <h2 className="menu-title">Menu</h2>

            <button
              className={`view-cart-btn ${cartCount > 0 ? "has-items" : ""}`}
              onClick={() => navigate("/b2c/cart")}
            >
              <FiShoppingCart color="#fff" size={16} />
              Cart
            </button>
          </div>

          {/* Item List */}
          <ItemList items={items} itemsLoaded={itemsLoaded} />
        </div>
      </div>
      <Footer/>
    </div>
  );
}
