// src/pages/ItemList.js
import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import { BiFoodTag } from "react-icons/bi";
import "./Items.css";
import axios from "axios";

const BASE_URL = "https://admin-aged-field-2794.fly.dev";

const ItemList = ({ items, handleToggleAvailability, handleDelete, refreshItems }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    Gst_precentage: "",
    tax_included: false,
    is_available: true,
    is_veg: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Open edit form
  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      price: item.price || item.final_price || "",
      Gst_precentage: item.Gst_precentage || "",
      tax_included: item.tax_included || false,
      is_available: item.is_available || false,
      is_veg: item.is_veg || false,
    });
    setImageFile(null);
    setShowUpdateForm(true);
  };

  // Close modal
  const handleClose = () => {
    setShowUpdateForm(false);
    setSelectedItem(null);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit full update (details + optional image)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("Gst_precentage", formData.Gst_precentage);
    data.append("tax_included", formData.tax_included);
    data.append("is_available", formData.is_available);
    data.append("is_veg", formData.is_veg);

    if (imageFile) {
      data.append("file", imageFile);
    }

    try {
      await axios.put(`${BASE_URL}/items/${selectedItem.id}/update-image-details`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Item updated successfully");
      if (refreshItems) await refreshItems(); // 🔁 refresh parent data
    } catch (error) {
      console.error("❌ Error updating item:", error.response?.data || error.message);
    }

    handleClose();
  };

  return (
    <div className="items-list">
      <h3>Items in this Category</h3>

      {Array.isArray(items) ? (
        items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={`${item.id}-${item.is_available}`} className="items-card-row">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="items-img"
                  onClick={() => window.open(item.image_url, "_blank")}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback.png";
                  }}
                />

                <div className="items-details">
                  <h4 className="items-name">{item.name}</h4>
                  <div className="price-gst">
                    <span className="items-price">₹{item.final_price}</span>
                    <span className="items-tax">
                      {item.tax_included
                        ? `incl. ${item.Gst_precentage}% GST`
                        : `+ ${item.Gst_precentage}% GST`}
                    </span>
                  </div>
                </div>

                <BiFoodTag
                  className="veg-icon"
                  title={item.is_veg ? "Veg" : "Non-Veg"}
                  style={{ color: item.is_veg ? "#008000" : "#cc0000" }}
                />

                <label className={`availability-switch ${item.is_available ? "on" : "off"}`}>
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() =>
                      handleToggleAvailability(item.id, item.is_available)
                    }
                  />
                  <span className="slider" />
                </label>

                <div className="items-actions">
                  <button
                    className="dots-btn"
                    title="More actions"
                    onClick={() =>
                      setActiveDropdown(activeDropdown === item.id ? null : item.id)
                    }
                  >
                    <FaEllipsisV />
                  </button>

                  {activeDropdown === item.id && (
                    <div className="dropdown-menu">
                      <button
                        onClick={() =>
                          handleToggleAvailability(item.id, item.is_available)
                        }
                      >
                        {item.is_available ? "Mark Unavailable" : "Mark Available"}
                      </button>
                      <button onClick={() => handleUpdateClick(item)}>
                        Edit / Update Image
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <p>Loading items...</p>
      )}

      {showUpdateForm && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h3>Update Item Details</h3>
            <form onSubmit={handleSubmit}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />

              <label>GST %:</label>
              <input
                type="number"
                name="Gst_precentage"
                value={formData.Gst_precentage}
                onChange={handleChange}
                required
              />

              <label>
                <input
                  type="checkbox"
                  name="tax_included"
                  checked={formData.tax_included}
                  onChange={handleChange}
                />{" "}
                Tax Included
              </label>

              <label>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                />{" "}
                Available
              </label>

              <label>
                <input
                  type="checkbox"
                  name="is_veg"
                  checked={formData.is_veg}
                  onChange={handleChange}
                />{" "}
                Veg
              </label>

              <label>Upload New Image (optional):</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />

              <div className="form-actions">
                <button type="submit">Update</button>
                <button type="button" className="cancel" onClick={handleClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
