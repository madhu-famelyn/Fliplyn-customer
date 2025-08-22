// src/pages/vendor/VendorItems.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContex/ContextAPI";
import axios from "axios";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import "./Items.css";

const VendorItems = () => {
  const { stallId, token, userId } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stallAvailable, setStallAvailable] = useState(false);
  const [stallName, setStallName] = useState("");

  // ✅ Fetch stall info
  useEffect(() => {
    if (!stallId) return;

    const fetchStall = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/stalls/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStallName(response.data.name);
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

  // ✅ Fetch items
  useEffect(() => {
    if (!stallId) {
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/items/stall/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (Array.isArray(response.data)) {
          setItems(response.data);

          // ✅ Stall should be ON only if all items are ON
          const allAvailable = response.data.every((item) => item.is_available);
          setStallAvailable(allAvailable);
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

  // ✅ Toggle single item
  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const url = `http://127.0.0.1:8000/items/${userId}/items/${itemId}/availability`;

      await axios.put(
        url,
        {},
        {
          params: { is_available: newStatus },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_available: newStatus } : item
        )
      );

      // ✅ If after update all items are ON, set stallAvailable true
      // ❌ But don’t flip it OFF if one goes OFF
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === itemId ? { ...item, is_available: newStatus } : item
        );
        if (updated.every((i) => i.is_available)) {
          setStallAvailable(true);
        }
        return updated;
      });
    } catch (error) {
      console.error(
        "❌ Error updating availability:",
        error.response?.data || error.message
      );
    }
  };

  // ✅ Toggle all items (bulk stall toggle)
  const toggleStallAvailability = async () => {
    try {
      const newStatus = !stallAvailable;
      setStallAvailable(newStatus);

      await Promise.all(
        items.map((item) =>
          axios.put(
            `http://127.0.0.1:8000/items/${userId}/items/${item.id}/availability`,
            {},
            {
              params: { is_available: newStatus },
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        )
      );

      setItems((prev) =>
        prev.map((item) => ({ ...item, is_available: newStatus }))
      );
    } catch (error) {
      console.error(
        "❌ Error updating stall availability:",
        error.response?.data || error.message
      );
    }
  };

  if (!stallId)
    return <p className="text-red-600">No stall assigned to this vendor.</p>;
  if (loading) return <p>Loading items...</p>;

  return (
    <div>
      <TokenHeader/>
    <div className="vendor-container">
      {/* ✅ Stall Card */}
      <div className="stall-container">
        <div className="stall-card">
          <h2 className="stall-name">{stallName || `Stall ${stallId}`}</h2>
          <label className="switch">
            <input
              type="checkbox"
              checked={stallAvailable}
              onChange={toggleStallAvailability}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* ✅ Items Grid */}
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
              <p className="price">₹{item.final_price}</p>

              <label className="switch small">
                <input
                  type="checkbox"
                  checked={item.is_available}
                  onChange={() =>
                    toggleAvailability(item.id, item.is_available)
                  }
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
