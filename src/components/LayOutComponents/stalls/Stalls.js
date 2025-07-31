import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContex/ContextAPI';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';

import './Stalls.css';
import {
  createStall,
  fetchStallsByBuilding,
  fetchBuildings,
} from '../stalls/Service';

export default function CreateStallForm({ onStallCreated }) {
  const { userId: adminId, token } = useAuth(); // ✅ Admin only
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    building_id: '',
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [allStalls, setAllStalls] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (adminId && token) {
      fetchBuildings(adminId, token)
        .then((data) => {
          setBuildings(data);
          if (data.length > 0) {
            const firstBuildingId = data[0].id;
            setForm((prev) => ({ ...prev, building_id: firstBuildingId }));
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
    if (!form.name || !form.description || !form.building_id || !form.file) {
      return alert('⚠️ Please fill all fields and upload an image.');
    }

    setLoading(true);
    try {
      const result = await createStall({ ...form, user_id: adminId }, token);
      alert('✅ Stall created successfully!');
      setForm({
        name: '',
        description: '',
        building_id: form.building_id,
        file: null,
      });
      if (onStallCreated) {
        const updatedStalls = await fetchStallsByBuilding(result.building_id, token);
        onStallCreated(result.building_id, updatedStalls);
      }
      fetchAllStalls(buildings, token);
      setShowForm(false); // ✅ Hide form after successful creation
    } catch (err) {
      console.error('❌ Stall creation failed:', err);
      alert('Error creating stall');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (stallId, buildingId) => {
    navigate(`/add-category/${stallId}`, {
      state: {
        buildingId,
        adminId,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="stall-container">
        <h1 className="stall-heading">Stall Management</h1>

        <button className="toggle-button" onClick={() => setShowForm(!showForm)}>
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
           <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />

            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Stall'}
            </button>
          </form>
        )}

        {/* ✅ Show all stalls grouped by building */}
        <div className="stall-list">
          {allStalls.map(({ building, stalls }) => (
            <div key={building.id} className="building-block">
              <h2>{building.building_name || building.name}</h2>
              {stalls.length === 0 ? (
                <p>No stalls found.</p>
              ) : (
                <div className="stalls-grid">
                  {stalls.map((stall) => (
                    <div
                      key={stall.id}
                      className="stall-card"
                      onClick={() => handleCardClick(stall.id, building.id)}
                      style={{ cursor: 'pointer' }}
                    >
<img
  src={`https://fliplyn.onrender.com/uploaded_images${stall.image_url.split('uploaded_images')[1] || ''}`}
  alt={stall.name}
  className="stall-image"
/>


                      <div className="stall-info">
                        <h3>{stall.name}</h3>
                        <p><strong>Description:</strong> {stall.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
