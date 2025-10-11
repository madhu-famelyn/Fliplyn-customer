import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./ManagerItems.css";
import { useNavigate } from "react-router-dom";



export default function ItemListByStall() {
  const { stallId } = useParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState(null);
    const navigate = useNavigate();
  
  const [updateForm, setUpdateForm] = useState({
    name: "",
    price: "",
    Gst_precentage: "",
    tax_included: false,
    is_available: true,
    is_veg: true,
    file: null,
  });

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
    // Backend base URL (you can move this to a config file or .env)
    const API_BASE_URL = "https://admin-aged-field-2794.fly.dev";

    // Send PATCH request to backend
    await axios.patch(
      `${API_BASE_URL}/items/items/${itemId}/availability`,
      { is_available: !currentStatus }
    );

    // Update UI after success
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      )
    );
  } catch (err) {
    console.error("❌ Error updating availability:", err);
    alert("Failed to update availability. Please try again.");
  }
};


  // ✅ Open Edit Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setUpdateForm({
      name: item.name || "",
      price: item.price || "",
      Gst_precentage: item.Gst_precentage || "",
      tax_included: item.tax_included || false,
      is_available: item.is_available || true,
      is_veg: item.is_veg || true,
      file: null,
    });
  };

  // ✅ Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setUpdateForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setUpdateForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setUpdateForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Submit Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData();
    formData.append("name", updateForm.name);
    formData.append("price", updateForm.price);
    formData.append("Gst_precentage", updateForm.Gst_precentage);
    formData.append("tax_included", updateForm.tax_included);
    formData.append("is_available", updateForm.is_available);
    formData.append("is_veg", updateForm.is_veg);
    if (updateForm.file) {
      formData.append("file", updateForm.file);
    }

    try {
      const response = await axios.put(
        `https://admin-aged-field-2794.fly.dev/items/${editingItem.id}/update-image-details`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // ✅ Update UI
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...response.data } : item
        )
      );

      setEditingItem(null);
      alert("Item updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update item. Please try again.");
    }
  };

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="ils-wrapper">
      <h2 className="ils-heading">Items for Stall /</h2>   


    
      
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
              <div className="ils-actions">
                
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
                <button
                  className="ils-edit-btn"
                  onClick={() => openEditModal(item)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Edit Modal */}
      {editingItem && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>Update Item</h3>
            <form onSubmit={handleUpdateSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Item name"
                value={updateForm.name}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={updateForm.price}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="Gst_precentage"
                placeholder="GST %"
                value={updateForm.Gst_precentage}
                onChange={handleChange}
              />

              <label>
                <input
                  type="checkbox"
                  name="tax_included"
                  checked={updateForm.tax_included}
                  onChange={handleChange}
                />
                Tax Included
              </label>

              <label>
                <input
                  type="checkbox"
                  name="is_veg"
                  checked={updateForm.is_veg}
                  onChange={handleChange}
                />
                Vegetarian
              </label>

              <label>
                Upload New Image:
                <input type="file" name="file" onChange={handleChange} />
              </label>

              <div className="ils-modal-buttons">
                <button type="submit" className="ils-save-btn">
                  Update
                </button>
                <button
                  type="button"
                  className="ils-cancel-btn"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
