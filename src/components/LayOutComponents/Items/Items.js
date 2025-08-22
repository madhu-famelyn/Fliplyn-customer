// src/pages/Item.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createItem,
  getItemsByCategoryId,
  updateItemAvailability,
  deleteItemById,
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import ItemForm from './ItemForm';
import ItemList from './ItemList';
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

    if (name === 'tax_included') {
      const isChecked = checked;
      setFormData((prev) => ({
        ...prev,
        tax_included: isChecked,
        Gst_precentage: isChecked ? '' : prev.Gst_precentage,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
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
    const confirmDelete = window.confirm('Are you sure you want to delete this item?');
    if (!confirmDelete) return;

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
          <ItemForm
            formData={formData}
            file={file}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setFile={setFile}
            message={message}
          />
        )}

        <ItemList
          items={items}
          handleToggleAvailability={handleToggleAvailability}
          handleDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  );
};

export default Item;
