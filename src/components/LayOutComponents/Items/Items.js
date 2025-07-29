// src/pages/Item.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createItem,
  getItemsByCategoryId,
  updateItemAvailability,
  deleteItemById, // ✅ import delete function
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import './Items.css';

const Item = () => {
  const location = useLocation();
  const { buildingId, stallId, categoryId } = location.state || {};
  const { userId: adminId } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    Gst_precentage: '',
    tax_included: false,
    is_available: true,
    building_id: '',
    stall_id: '',
    category_id: '',
    admin_id: '',
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (buildingId && stallId && categoryId && adminId) {
      setFormData((prev) => ({
        ...prev,
        building_id: buildingId,
        stall_id: stallId,
        category_id: categoryId,
        admin_id: adminId,
      }));
      fetchItems(categoryId);
    }
  }, [buildingId, stallId, categoryId, adminId]);

const fetchItems = async (catId) => {
  try {
    const data = await getItemsByCategoryId(catId);
    console.log('Fetched Items:', data);

    const sorted = Array.isArray(data)
      ? data.sort((a, b) => (b.is_available === true) - (a.is_available === true))
      : [];

    setItems(sorted);
  } catch (err) {
    console.error('Failed to fetch items:', err);
    setItems([]);
  }
};


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formPayload = new FormData();
    for (const key in formData) {
      if (formData[key] !== '') {
        formPayload.append(key, formData[key]);
      }
    }
    if (file) formPayload.append('file', file);

    try {
      await createItem(formPayload);
      setMessage('✅ Item created successfully!');
      setFormData((prev) => ({
        ...prev,
        name: '',
        description: '',
        price: '',
        Gst_precentage: '',
        tax_included: false,
        is_available: true,
      }));
      setFile(null);
      fetchItems(categoryId);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to create item');
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await updateItemAvailability(itemId, !currentStatus);
      fetchItems(categoryId);
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleDelete = async (itemId) => {
    const confirm = window.confirm('Are you sure you want to delete this item?');
    if (!confirm) return;

    try {
      await deleteItemById(itemId);
      setMessage('🗑️ Item deleted');
      fetchItems(categoryId);
    } catch (err) {
      console.error('Error deleting item:', err);
      setMessage('❌ Failed to delete item');
    }
  };

  return (
    <AdminLayout>
      <div className="item-container">
        <h2>Items</h2>

        <button onClick={() => setShowForm(!showForm)} className="add-item-btn">
          {showForm ? 'Close Form' : '+ Add Item'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="item-form">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="Gst_precentage"
              placeholder="GST %"
              value={formData.Gst_precentage}
              onChange={handleChange}
            />

            <label>
              <input
                type="checkbox"
                name="tax_included"
                checked={formData.tax_included}
                onChange={handleChange}
              />
              Tax Included
            </label>

            <label>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
              />
              Is Available
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <button type="submit">Submit</button>
          </form>
        )}

        {message && <p className="item-message">{message}</p>}

        <div className="item-list">
          <h3>Items in this Category</h3>
          {Array.isArray(items) ? (
            items.length === 0 ? (
              <p>No items found.</p>
            ) : (
              <div className="item-grid">
                {items.map((item) => (
<div key={`${item.id}-${item.is_available}`} className="item-card animate-move">
  <img
    src={`https://fliplyn-api.onrender.com/${item.image_url}`}
    alt={item.name}
    className="item-img"
    onClick={() =>
      window.open(`https://fliplyn-api.onrender.com/${item.image_url}`, '_blank')
    }
  />

  <div className="item-info">
    <div className="item-header">
      <div>
        <h4>{item.name}</h4>
      </div>
      <p className="item-price"><b>₹ {item.final_price}</b></p>
    </div>

    <div className="item-bottom">
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={item.is_available}
          onChange={() => handleToggleAvailability(item.id, item.is_available)}
        />
        <span>{item.is_available ? 'Available' : 'Unavailable'}</span>
      </label>

      <button
        className="delete-btn"
        onClick={() => handleDelete(item.id)}
        title="Delete Item"
      >
        🗑
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default Item;
