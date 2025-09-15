// src/pages/ItemList.js
import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import { BiFoodTag } from "react-icons/bi";
import "./Items.css";
import axios from "axios";

const ItemList = ({ items, handleToggleAvailability, handleDelete, refreshItems }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    final_price: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Open edit form
  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      final_price: item.final_price,
      image_url: item.image_url,
    });
    setShowUpdateForm(true);
  };

  // Open image update form
  const handleImageUpdateClick = (item) => {
    setSelectedItem(item);
    setImageFile(null);
    setShowImageForm(true);
  };

  // Close modals
  const handleClose = () => {
    setShowUpdateForm(false);
    setShowImageForm(false);
    setSelectedItem(null);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit update (name/price/image_url string)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const data = new FormData();
    data.append("name", formData.name);
    data.append("final_price", formData.final_price);
    data.append("image_url", formData.image_url);
    data.append("is_available", selectedItem.is_available);

    try {
      await axios.put(
        `https://admin-aged-field-2794.fly.dev/api/item/${selectedItem.id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("✅ Item updated successfully");
      if (refreshItems) refreshItems();
    } catch (error) {
      console.error("❌ Error updating item:", error.response?.data || error.message);
    }

    handleClose();
  };

  // Submit image update only
  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !imageFile) return;

    const data = new FormData();
    data.append("file", imageFile); // ✅ must match backend parameter name

    try {
      await axios.put(
        `https://admin-aged-field-2794.fly.dev/items/items/${selectedItem.id}/upload-image`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("✅ Item image updated successfully");
      if (refreshItems) refreshItems();
    } catch (error) {
      console.error("❌ Error updating image:", error.response?.data || error.message);
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
              <div
                key={`${item.id}-${item.is_available}`}
                className="items-card-row"
              >
                {/* Item image */}
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

                {/* Item details */}
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

                {/* Veg/Non-Veg icon */}
                <BiFoodTag
                  className="veg-icon"
                  title={item.is_veg ? "Veg" : "Non-Veg"}
                  style={{ color: item.is_veg ? "#008000" : "#cc0000" }}
                />

                {/* Availability switch */}
                <label
                  className={`availability-switch ${
                    item.is_available ? "on" : "off"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() =>
                      handleToggleAvailability(item.id, item.is_available)
                    }
                  />
                  <span className="slider" />
                </label>

                {/* Dropdown actions */}
                <div className="items-actions">
                  <button
                    className="dots-btn"
                    title="More actions"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === item.id ? null : item.id
                      )
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
                        {item.is_available
                          ? "Mark Unavailable"
                          : "Mark Available"}
                      </button>
                      <button onClick={() => handleUpdateClick(item)}>Edit</button>
                      <button onClick={() => handleImageUpdateClick(item)}>
                        Update Image
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

      {/* Update modal (name/price/url) */}
      {showUpdateForm && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h3>Update Item</h3>
            <form onSubmit={handleSubmit}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label>Final Price:</label>
              <input
                type="number"
                name="final_price"
                value={formData.final_price}
                onChange={handleChange}
                required
              />

              <label>Image URL:</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
              />

              <div className="form-actions">
                <button type="submit">Update</button>
                <button
                  type="button"
                  className="cancel"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update image modal */}
      {showImageForm && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h3>Update Item Image</h3>
            <form onSubmit={handleImageSubmit}>
              <label>Upload New Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                required
              />

              <div className="form-actions">
                <button type="submit">Update Image</button>
                <button
                  type="button"
                  className="cancel"
                  onClick={handleClose}
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
};

export default ItemList;
