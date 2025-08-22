// src/pages/ItemList.js
import React, { useState } from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import { BiFoodTag } from 'react-icons/bi';
import './Items.css';
import axios from 'axios';

const ItemList = ({ items, handleToggleAvailability, handleDelete }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    final_price: '',
    image_url: '',
  });

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      final_price: item.final_price,
      image_url: item.image_url,
    });
    setShowUpdateForm(true);
  };

  const handleClose = () => {
    setShowUpdateForm(false);
    setSelectedItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('final_price', formData.final_price);
    data.append('image_url', formData.image_url);
    data.append('is_available', selectedItem.is_available);

    try {
      const response = await axios.put(
        `http://localhost:8000/api/item/${selectedItem.id}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('✅ Item updated:', response.data);
      window.location.reload();
    } catch (error) {
      console.error('❌ Error updating item:', error.response?.data || error.message);
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
                  onClick={() => window.open(item.image_url, '_blank')}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/fallback.png';
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
                  title={item.is_veg ? 'Veg' : 'Non-Veg'}
                  style={{ color: item.is_veg ? '#008000' : '#cc0000' }}
                />

                <label className={`availability-switch ${item.is_available ? 'on' : 'off'}`}>
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() => handleToggleAvailability(item.id, item.is_available)}
                  />
                  <span className="slider" />
                </label>

                <div className="items-actions">
                  <button className="dots-btn" title="More actions">
                    <FaEllipsisV />
                  </button>
                  <div className="dropdown-menu">
                    <button onClick={() => handleToggleAvailability(item.id, item.is_available)}>
                      {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button onClick={() => handleUpdateClick(item)}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="danger">
                      Delete
                    </button>
                  </div>
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