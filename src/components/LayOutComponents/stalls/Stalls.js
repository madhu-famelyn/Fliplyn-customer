// src/pages/stalls/stall.js

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
} from './Service';

export default function CreateStallForm() {
  const { userId: adminId, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    building_id: '',
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
      fetchBuildings(adminId, token)
        .then((data) => {
          setBuildings(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, building_id: data[0].id }));
            fetchAllStalls(data, token);
          }
        })
        .catch((err) => console.error('❌ Error fetching buildings:', err));
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.building_id || (!form.file && !editMode)) {
      return alert('⚠️ Please fill all fields.');
    }

    setLoading(true);
    try {
      if (editMode) {
        await updateStall(editingStallId, { ...form, admin_id: adminId }, token);
        alert('✅ Stall updated successfully!');
      } else {
        await createStall({ ...form, user_id: adminId }, token);
        alert('✅ Stall created successfully!');
      }

      setForm({ name: '', description: '', building_id: form.building_id, file: null });
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
      file: null,
    });
    setEditingStallId(stall.id);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleCardClick = (stallId, buildingId) => {
    navigate(`/add-category/${stallId}`, {
      state: { buildingId, adminId },
    });
  };

  return (
    <AdminLayout>
      <div className="stall-container">
        <h1 className="stall-heading">Stall Management</h1>

        <button className="toggle-button" onClick={() => {
          setShowForm(!showForm);
          setEditMode(false);
          setForm({ name: '', description: '', building_id: buildings[0]?.id || '', file: null });
        }}>
          {showForm ? '✖ Close Form' : '➕ Add Stall'}
        </button>

        {showForm && (
          <form className="stall-form" onSubmit={handleSubmit}>
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
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button type="submit" disabled={loading}>
              {loading ? (editMode ? 'Updating...' : 'Creating...') : editMode ? 'Update Stall' : 'Create Stall'}
            </button>
          </form>
        )}

        <div className="stall-list">
          {allStalls.map(({ building, stalls }) => (
            <div key={building.id} className="building-block">
              <h2>{building.building_name || building.name}</h2>
              {stalls.length === 0 ? (
                <p>No stalls found.</p>
              ) : (
                <div className="stalls-grid">
                  {stalls.map((stall) => (
                    <div key={stall.id} className="stall-card">
                      <img
                        src={`https://fliplyn.onrender.com/uploaded_images${stall.image_url?.split('uploaded_images')[1] || ''}`}
                        alt={stall.name}
                        className="stall-image"
                        onClick={() => handleCardClick(stall.id, building.id)}
                      />
                      <div className="stall-info">
                        <h3>{stall.name}</h3>
                        <p><strong>Description:</strong> {stall.description}</p>
                      </div>
                      <FaEdit
                        className="edit-icon"
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
          <div className="popup-overlay">
            <div className="popup-form">
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
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <div className="popup-buttons">
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
