
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContex/ContextAPI';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';
import { FaEdit } from 'react-icons/fa';
import './Stalls.css';
import {
  createStall,
  fetchStallsByBuilding,
  fetchBuildings,
  updateStall,
  deleteStall,
} from './Service';

export default function CreateStallForm() {
  const { userId: adminId, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    building_id: '',
    manager_id: '',
    opening_time: '',
    closing_time: '',
    is_available: true,
    file: null,
  });

  const [editMode, setEditMode] = useState(false);
  const [editingStallId, setEditingStallId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [allStalls, setAllStalls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  
useEffect(() => {
  if (adminId && token) {
    console.log("✅ useEffect - Using adminId from context:", adminId);
    console.log("✅ useEffect - Using token:", token);

    fetchBuildings(adminId, token)
      .then((data) => {
        console.log("🏢 Buildings fetched:", data);
        setBuildings(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, building_id: data[0].id }));
          fetchAllStalls(data, token);
        }
      })
      .catch((err) => console.error('❌ Error fetching buildings:', err));
  } else {
    console.warn("⚠️ No adminId/token found in context or localStorage", { adminId, token });
  }
}, [adminId, token]);


  const fetchAllStalls = async (buildings, token) => {
    try {
      const allStallsPromises = buildings.map((b) =>
        fetchStallsByBuilding(b.id, token)
      );
      const allStallsResults = await Promise.all(allStallsPromises);
      const stallsWithBuilding = buildings.map((building, i) => ({
        building,
        stalls: allStallsResults[i],
      }));
      setAllStalls(stallsWithBuilding);
    } catch (error) {
      console.error('❌ Failed to fetch stalls:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, file: e.target.files[0] }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!adminId) {
    alert("⚠️ Admin ID missing. Please login again.");
    return;
  }

  if (!form.name || !form.description || !form.building_id || (!form.file && !editMode)) {
    return alert('⚠️ Please fill all required fields.');
  }

  console.log("📤 Submitting stall with adminId:", adminId);

  setLoading(true);
  try {
if (editMode) {
  const updatedStall = await updateStall(editingStallId, { ...form, admin_id: adminId }, token);
  alert('✅ Stall updated successfully!');

  // Update local UI without waiting for fetch
  setAllStalls(prev =>
    prev.map(group =>
      group.building.id === form.building_id
        ? {
            ...group,
            stalls: group.stalls.map(s =>
              s.id === editingStallId ? { ...s, ...form } : s
            ),
          }
        : group
    )
  );
}else {
      // ✅ Use FormData for create
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("building_id", form.building_id);
      formData.append("admin_id", adminId);
      if (form.manager_id) formData.append("manager_id", form.manager_id);
      if (form.opening_time) formData.append("opening_time", form.opening_time);
      if (form.closing_time) formData.append("closing_time", form.closing_time);
      formData.append("is_available", form.is_available);
      if (form.file) formData.append("file", form.file);

      await createStall(formData, token);
      alert('✅ Stall created successfully!');
    }

    // Reset form after success
    setForm({
      name: '',
      description: '',
      building_id: form.building_id,
      manager_id: '',
      opening_time: '',
      closing_time: '',
      is_available: true,
      file: null,
    });
    setShowForm(false);
    setEditMode(false);
    setEditingStallId(null);
    setShowPopup(false);
    fetchAllStalls(buildings, token);

  } catch (err) {
    console.error('❌ Operation failed:', err);
    alert('Operation failed');
  } finally {
    setLoading(false);
  }
};


  const handleEditClick = (stall) => {
    setForm({
      name: stall.name,
      description: stall.description,
      building_id: stall.building_id,
      manager_id: stall.manager_id || '',
      opening_time: stall.opening_time || '',
      closing_time: stall.closing_time || '',
      is_available: stall.is_available ?? true,
      file: null,
    });
    setEditingStallId(stall.id);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDeleteStall = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete this stall?')) return;
    try {
      await deleteStall(editingStallId, token);
      alert('🗑️ Stall deleted successfully!');
      setShowPopup(false);
      fetchAllStalls(buildings, token);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Delete failed');
    }
  };

  const handleCardClick = (stallId, buildingId) => {
    navigate(`/add-category/${stallId}`, {
      state: { buildingId, adminId },
    });
  };

  return (
    <AdminLayout>
      <div className=" stalls-admin-stall-container">
        <h1 className=" stalls-admin-stall-heading">Stall Management</h1>

        <button
          className=" stalls-admin-toggle-button"
          onClick={() => {
            setShowForm(!showForm);
            setEditMode(false);
            setForm({
              name: '',
              description: '',
              building_id: buildings[0]?.id || '',
              manager_id: '',
              opening_time: '',
              closing_time: '',
              is_available: true,
              file: null,
            });
          }}
        >
          {showForm ? '✖ Close Form' : '➕ Add Stall'}
        </button>

        {showForm && (
          <form className=" stalls-admin-stall-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Stall Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
            />
            <select
              name="building_id"
              value={form.building_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Building --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name || b.name || 'Unnamed'}
                </option>
              ))}
            </select>
          
            <input
              type="text"
              name="opening_time"
              placeholder="Opening Time (e.g. 09:00 AM)"
              value={form.opening_time}
              onChange={handleChange}
            />
            <input
              type="text"
              name="closing_time"
              placeholder="Closing Time (e.g. 10:00 PM)"
              value={form.closing_time}
              onChange={handleChange}
            />
<div className=" stalls-admin-toggle-switch">
  <input
    type="checkbox"
    id="is_available"
    name="is_available"
    className=" stalls-admin-toggle-input"
    checked={form.is_available}
    onChange={handleChange}
  />
  <label className=" stalls-admin-toggle-label" htmlFor="is_available">
    <span className=" stalls-admin-toggle-slider"></span>
  </label>
  <span className=" stalls-admin-toggle-text">
    {form.is_available ? "Available" : "Unavailable"}
  </span>
</div>

            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button type="submit" disabled={loading}>
              {loading ? (editMode ? 'Updating...' : 'Creating...') : editMode ? 'Update Stall' : 'Create Stall'}
            </button>
          </form>
        )}

        <div className=" stalls-admin-stall-list">
          {allStalls.map(({ building, stalls }) => (
            <div key={building.id} className=" stalls-admin-building-block">
              <h2>{building.building_name || building.name}</h2>
              {stalls.length === 0 ? (
                <p>No stalls found.</p>
              ) : (
                <div className=" stalls-admin-stalls-grid">
                  {stalls.map((stall) => (
                    <div key={stall.id} className=" stalls-admin-stall-card">
                      <img
                        src={stall.image_url}
                        alt={stall.name}
                        className=" stalls-admin-stall-image"
                        onClick={() => handleCardClick(stall.id, building.id)}
                      />
                      <div className=" stalls-admin-stall-info">
                        <h3>{stall.name}</h3>
                        <p><strong>Description:</strong> {stall.description}</p>
                        <p><strong>Opens:</strong> {stall.opening_time || 'N/A'} - <strong>Closes:</strong> {stall.closing_time || 'N/A'}</p>
                        <p><strong>Status:</strong> {stall.is_available ? '✅ Available' : '❌ Unavailable'}</p>
                      </div>
                      <FaEdit
                        className=" stalls-admin-edit-icon"
                        onClick={() => handleEditClick(stall)}
                        title="Edit Stall"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showPopup && (
          <div className=" stalls-admin-popup-overlay">
            <div className=" stalls-admin-popup-form">
              <h2>Edit Stall</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Stall Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
                <select
                  name="building_id"
                  value={form.building_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Building --</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.building_name || b.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
               
                <input
                  type="text"
                  name="opening_time"
                  placeholder="Opening Time (e.g. 09:00 AM)"
                  value={form.opening_time}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="closing_time"
                  placeholder="Closing Time (e.g. 10:00 PM)"
                  value={form.closing_time}
                  onChange={handleChange}
                />
                <div className=" stalls-admin-toggle-switch">
  <input
    type="checkbox"
    id="is_available"
    name="is_available"
    className=" stalls-admin-toggle-input"
    checked={form.is_available}
    onChange={handleChange}
  />
  <label className=" stalls-admin-toggle-label" htmlFor="is_available">
    <span className=" stalls-admin-toggle-slider"></span>
  </label>
  <span className=" stalls-admin-toggle-text">
    {form.is_available ? "Available" : "Unavailable"}
  </span>
</div>

                <input type="file" accept="image/*" onChange={handleFileChange} />

                <div className=" stalls-admin-popup-buttons">
                  <button type="button" className=" stalls-admin-delete-btn" onClick={handleDeleteStall}>
                    🗑️ Delete
                  </button>
                  <button type="button" onClick={() => setShowPopup(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
