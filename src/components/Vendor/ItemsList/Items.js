import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContex/ContextAPI";
import axios from "axios";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import { useParams } from "react-router-dom";
import "./Items.css";

const VendorItems = () => {
  const { id } = useParams(); // ✅ read stallId from URL
  const { stallId: contextStallId, token } = useAuth();
  const stallId = id || contextStallId; // ✅ URL first, then context

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stallAvailable, setStallAvailable] = useState(false);
  const [stallName, setStallName] = useState("");

  // Fetch stall info
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
        console.error("❌ Error fetching stall info:", error.response?.data || error.message);
      }
    };

    fetchStall();
  }, [stallId, token]);

  // Fetch items
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
          const allAvailable = response.data.every((item) => item.is_available);
          setStallAvailable(allAvailable);
        }
      } catch (error) {
        console.error("❌ Error fetching items:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [stallId, token]);

  if (!stallId) return <p className="text-red-600">No stall selected.</p>;
  if (loading) return <p>Loading items...</p>;

  return (
    <div>
      <TokenHeader />
      <div className="vendor-container">
        {/* Stall Card */}
        <div className="stall-container">
          <div className="stall-card">
            <h2 className="stall-name">{stallName || `Stall ${stallId}`}</h2>
            <label className="switch">
              <input
                type="checkbox"
                checked={stallAvailable}
                onChange={() => {
                  const newStatus = !stallAvailable;
                  setStallAvailable(newStatus);
                  setItems((prev) => prev.map((i) => ({ ...i, is_available: newStatus })));
                }}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Items */}
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
                      setItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id ? { ...i, is_available: !i.is_available } : i
                        )
                      )
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
