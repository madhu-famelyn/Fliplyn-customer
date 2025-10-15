import React, { useEffect, useState } from "react";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import axios from "axios";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import { useParams, useNavigate } from "react-router-dom";
import "./Items.css";

const VendorItems = () => {
  const { id } = useParams();
  const { stallId: contextStallId, token, setStallId } = useVendorAuth();
  const stallId = id || contextStallId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stallAvailable, setStallAvailable] = useState(false);
  const [stallName, setStallName] = useState("");

  const navigate = useNavigate();

  // Fetch stall info
  useEffect(() => {
    if (!stallId) return;

    const fetchStall = async () => {
      try {
        const response = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStallName(response.data.name || "");
        if (response.data.is_available !== undefined) {
          setStallAvailable(response.data.is_available);
        }
      } catch (error) {
        console.error(
          "❌ Error fetching stall info:",
          error.response?.data || error.message
        );
      }
    };

    fetchStall();
  }, [stallId, token]);

  // Fetch items under the stall
  useEffect(() => {
    if (!stallId) {
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      try {
        const response = await axios.get(
          `https://admin-aged-field-2794.fly.dev/items/stall/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (Array.isArray(response.data)) {
          setItems(response.data);
        }
      } catch (error) {
        console.error(
          "❌ Error fetching items:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [stallId, token]);

  // Save stallId in context
  useEffect(() => {
    if (id && setStallId) setStallId(id);
  }, [id, setStallId]);

  // Update stall availability only
  const handleStallToggle = async () => {
    const newStatus = !stallAvailable;
    setStallAvailable(newStatus);

    try {
      await axios.put(
        `https://admin-aged-field-2794.fly.dev/stalls/${stallId}/availability`,
        { is_available: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Stall availability updated");
    } catch (error) {
      console.error(
        "❌ Error updating stall availability:",
        error.response?.data || error.message
      );
    }
  };

  // Update individual item availability
  const handleItemToggle = async (itemId, currentStatus) => {
    const newStatus = !currentStatus;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_available: newStatus } : i))
    );

    try {
      await axios.patch(
        `https://admin-aged-field-2794.fly.dev/items/items/${itemId}/availability`,
        { is_available: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Item ${itemId} availability updated`);
    } catch (error) {
      console.error(
        `❌ Error updating item ${itemId}:`,
        error.response?.data || error.message
      );
    }
  };

  if (!stallId) return <p className="text-red-600">No stall selected.</p>;
  if (loading) return <p>Loading items...</p>;

  return (
    <div>
      <TokenHeader />

      {/* Reports button */}
      

      <div className="vendor-container">
        <div className="nav-bar">
        <button
          className="view-reports-btn"
          onClick={() => navigate(`/stall/${stallId}/reports`)}
        >
          View Reports
        </button>
      </div>
        {/* Stall Card */}
        <div className="stall-container">
          <div className="stall-card">
            <h2 className="stall-name">{stallName || `Stall ${stallId}`}</h2>
            <label className="switch">
              <input
                type="checkbox"
                checked={stallAvailable}
                onChange={handleStallToggle}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <p>No items found for this stall.</p>
        ) : (
          <div className="vendor-grid">
            {items.map((item) => (
              <div key={item.id} className="vendor-card">
                <img
                  src={item.image_url || "https://via.placeholder.com/150"}
                  alt={item.name}
                />
                <h3>{item.name}</h3>
                <p className="price">price with GST₹{item.final_price}</p>
                <label className="switch small">
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() => handleItemToggle(item.id, item.is_available)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorItems;
