import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import "./Items.css";

const VendorItemsExact = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ FIX: removed setStallId (it does NOT exist in context)
  const { stallId: ctxStallId, token } = useVendorAuth();
  const stallId = id || ctxStallId;

  const [stall, setStall] = useState({});
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH STALL ---------------- */
  useEffect(() => {
    if (!stallId || !token) return;

    const fetchStall = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStall(res.data || {});
      } catch (err) {
        console.error("Error fetching stall:", err);
      }
    };

    fetchStall();
  }, [stallId, token]);

  /* ---------------- FETCH ITEMS ---------------- */
  useEffect(() => {
    if (!stallId || !token) return;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/items/stall/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [stallId, token]);

  /* ---------------- ITEM AVAILABILITY TOGGLE ---------------- */
  const toggleItem = async (itemId, currentStatus) => {
    // optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, is_available: !currentStatus }
          : item
      )
    );

    try {
      await axios.patch(
        `https://admin-aged-field-2794.fly.dev/items/${itemId}/availability`,
        { is_available: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  /* ---------------- FILTERED ITEMS ---------------- */
  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase())
      )
      .filter((item) => {
        if (filter === "AVAILABLE") return item.is_available;
        if (filter === "PAUSED") return !item.is_available;
        return true;
      });
  }, [items, search, filter]);

  if (!stallId) {
    return <p style={{ padding: 20 }}>No stall selected.</p>;
  }

  return (
    <div className="vix-root">
      <TokenHeader />

      {/* HEADER */}
      <div className="vix-header">
<div className="vix-header">
  <div className="vix-header-left">
    <div className="vix-title-row">
      <h1 className="vix-title">{stall.name || "Stall"}</h1>

      <button
        className="vix-report-btn"
        onClick={() => navigate(`/stall/${stallId}/reports`)}
      >
        Reports
      </button>
    </div>

    <p className="vix-desc">{stall.description || ""}</p>

    <div className="vix-timings">
      <span className="vix-open">
        Opens at {stall.opens_at || "10:00 AM"}
      </span>
      <span className="vix-close">
        Closes at {stall.closes_at || "8:00 PM"}
      </span>
    </div>
  </div>
</div>


      
      </div>







      {/* CONTROLS */}
      <div className="vix-controls">
        <input
          className="vix-search"
          placeholder="Search items by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="vix-filters">
          <button
            className={filter === "ALL" ? "active" : ""}
            onClick={() => setFilter("ALL")}
          >
            All
          </button>
          <button
            className={filter === "AVAILABLE" ? "active available" : "available"}
            onClick={() => setFilter("AVAILABLE")}
          >
            Available
          </button>
          <button
            className={filter === "PAUSED" ? "active paused" : "paused"}
            onClick={() => setFilter("PAUSED")}
          >
            Paused
          </button>
        </div>
      </div>





      {/* TABLE */}
      <div className="vix-table">
        <div className="vix-table-head">
          <span>Item</span>
          <span>Price</span>
          <span>Availability</span>
        </div>

        {loading ? (
          <p className="vix-loading">Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="vix-loading">No items found</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="vix-row">
              <div className="vix-item">
                <img
                  src={item.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E"}
                  alt={item.name}
                />
                <div>
                  <p className="vix-item-name">{item.name}</p>
                  <p className="vix-item-type">
                    {item.is_veg ? "Veg" : "Non Veg"}
                  </p>
                </div>
              </div>

              <div className="vix-price">
                ₹{item.final_price}
                <span>Inc. GST</span>
              </div>

              <label className="vix-switch">
                <input
                  type="checkbox"
                  checked={!!item.is_available}
                  onChange={() =>
                    toggleItem(item.id, item.is_available)
                  }
                />
                <span />
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorItemsExact;
