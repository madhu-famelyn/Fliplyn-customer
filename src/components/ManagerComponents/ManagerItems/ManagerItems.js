import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./ManagerItems.css";

export default function ItemListByStall() {
  const { stallId } = useParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      if (!stallId) {
        setError("Stall ID not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `https://admin-aged-field-2794.fly.dev/items/stall/${stallId}`
        );
        setItems(response.data);
        setFilteredItems(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch items.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [stallId]);

  useEffect(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  // ✅ Toggle Availability
  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      // Update backend
      await axios.patch(
        `https://admin-aged-field-2794.fly.dev/items/items/${itemId}/availability`,
        { is_available: !currentStatus }
      );

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      );
    } catch (err) {
      console.error("Error updating availability:", err);
      alert("Failed to update availability. Please try again.");
    }
  };

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="ils-wrapper">
      <h2 className="ils-heading">Items for Stall</h2>
      <input
        type="text"
        className="ils-search"
        placeholder="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="ils-row">
        {filteredItems.map((item) => {
          const gstAmount = item.Gst_precentage
            ? (item.price * item.Gst_precentage) / 100
            : 0;

          return (
            <div className="ils-card" key={item.id}>
              <img
                src={item.image_url || "/fallback.png"}
                alt={item.name}
                className="ils-image"
              />
              <div className="ils-info">
                <h3 className="ils-name">{item.name}</h3>
                <p className="ils-price">₹{item.price.toFixed(2)}</p>
                <p className="ils-gst">incl. {gstAmount.toFixed(2)} GST</p>
              </div>
              <div className="ils-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() =>
                      toggleAvailability(item.id, item.is_available)
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

