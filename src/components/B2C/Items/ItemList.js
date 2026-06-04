import React, { useState, useEffect, useCallback } from "react";
import "../Category/Category.css";
import "./Items.css";
import { useB2CAuth } from "../../AuthContex/B2CContext";
import { FiSearch } from "react-icons/fi";

const S3_BASE_URL = "https://fliplyn-assets.s3.ap-south-1.amazonaws.com/";

export default function B2CItemList({ items, itemsLoaded }) {
  const { b2cUser } = useB2CAuth();

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  /* Load cart */
  const loadLocalCart = useCallback(() => {
    const stored = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
    setCartItems(stored);
  }, []);

  useEffect(() => {
    loadLocalCart();
    window.addEventListener("b2c-cart-updated", loadLocalCart);
    return () => {
      window.removeEventListener("b2c-cart-updated", loadLocalCart);
    };
  }, [loadLocalCart]);

  /* Save Cart */
  const saveCart = (updatedCart) => {
    setCartItems(updatedCart);
    localStorage.setItem("b2c_cartItems", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("b2c-cart-updated"));
  };

  /* Add Item */
  const handleAddToCart = (item) => {
    if (!b2cUser || !b2cUser.id) {
      setPopupMessage("⚠️ Please log in to add items.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      return;
    }

    // ⛔ STALL CONFLICT CHECK
    if (cartItems.length > 0) {
      const existingStall = cartItems[0].stall_id;
      if (existingStall !== item.stall_id) {
        setPopupMessage("⚠ You can add items only from one stall at a time.");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
        return;
      }
    }

    const index = cartItems.findIndex((c) => c.id === item.id);
    let updatedCart = [...cartItems];

    if (index > -1) {
      updatedCart[index].quantity += 1;
    } else {
      updatedCart.push({
        id: item.id,
        name: item.name,
        desc: item.description,
        price: item.price,
        is_veg: item.is_veg,
        stall_id: item.stall_id,
        image_url: item.image_url?.startsWith("http")
          ? item.image_url
          : `${S3_BASE_URL}${item.image_url}`,
        quantity: 1,
      });
    }

    saveCart(updatedCart);

    setPopupMessage("Added to cart!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 900);
  };

  const handleDecreaseQuantity = (itemId) => {
    saveCart(
      cartItems
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleIncreaseQuantity = (itemId) => {
    saveCart(
      cartItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  /* ================= FILTER + SEARCH ================= */
  const filteredItems = items
    // ✅ SHOW ONLY AVAILABLE ITEMS
    .filter((item) => item.is_available === true)
    // VEG / NON-VEG FILTER
    .filter((item) => {
      if (filterType === "veg") return item.is_veg;
      if (filterType === "nonveg") return !item.is_veg;
      return true;
    })
    // SEARCH FILTER
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="items-section">
      {/* POPUP */}
      {showPopup && <div className="stall-popup">{popupMessage}</div>}

      {/* SEARCH BAR */}
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FILTER BUTTONS */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterType === "veg" ? "active" : ""}`}
          onClick={() => setFilterType("veg")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <div className="food-icon veg" style={{ position: "static", width: "12px", height: "12px", padding: "2px", border: "1.5px solid #22c55e", boxShadow: "none" }}>
            <div className="dot" style={{ width: "6px", height: "6px", backgroundColor: "#22c55e" }}></div>
          </div>
          Veg
        </button>
        <button
          className={`filter-btn ${filterType === "nonveg" ? "active" : ""}`}
          onClick={() => setFilterType("nonveg")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <div className="food-icon nonveg" style={{ position: "static", width: "12px", height: "12px", padding: "2px", border: "1.5px solid #ef4444", boxShadow: "none" }}>
            <div className="dot" style={{ width: "6px", height: "6px", backgroundColor: "#ef4444" }}></div>
          </div>
          Non-Veg
        </button>
      </div>

      {/* ITEMS / EMPTY STATE */}
      {itemsLoaded && filteredItems.length === 0 ? (
        <div className="no-items">
          <p>No items available</p>
        </div>
      ) : (
        <div className="item-grid">
          {filteredItems.map((item) => {
            const cartItem = cartItems.find((c) => c.id === item.id);
            const isInCart = !!cartItem;

            return (
              <div className="item-card" key={item.id}>
                <div className="item-img-wrapper">
                  <img
                    src={
                      item.image_url?.startsWith("http")
                        ? item.image_url
                        : `${S3_BASE_URL}${item.image_url}`
                    }
                    alt={item.name}
                    className="item-img"
                    onError={(e) => {
                      e.target.src = "/fallback-item.jpg";
                    }}
                  />

                  <div
                    className={`food-icon ${
                      item.is_veg ? "veg" : "nonveg"
                    }`}
                  >
                    <div className="dot"></div>
                  </div>
                </div>

                <div className="item-info">
                  <h4 className="item-name">{item.name}</h4>

                  <div className="price-add-row">
                    <span className="price">₹ {item.price}</span>

                    {!isInCart ? (
                      <button
                        className="add-btn-btn"
                        onClick={() => handleAddToCart(item)}
                      >
                        + Add
                      </button>
                    ) : (
                      <div className="qty-box">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleDecreaseQuantity(item.id)
                          }
                        >
                          –
                        </button>
                        <span className="qty-value">
                          {cartItem.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleIncreaseQuantity(item.id)
                          }
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
