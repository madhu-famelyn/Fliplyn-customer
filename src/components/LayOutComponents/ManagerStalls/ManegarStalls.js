import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import '../stalls/Stalls.css';
import {
  getManagerById,
  fetchStallsByBuilding,
  createStall
} from './Service';

export default function ManagerStalls() {
  const { userId: managerId, token } = useAuth();
  const [buildingId, setBuildingId] = useState('');
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    file: null,
  });
  const [showForm, setShowForm] = useState(false);

  // ✅ Fetch manager details and stalls
  useEffect(() => {
    const fetchManagerAndStalls = async () => {
      try {
        console.log('📥 Fetching manager with ID:', managerId);
        const manager = await getManagerById(managerId, token);
        console.log('✅ Manager fetched:', manager);

        const bId = manager.building_id;
        setBuildingId(bId);
        console.log('📦 Assigned building ID:', bId);

        const stallsData = await fetchStallsByBuilding(bId, token);
        console.log(`✅ Fetched ${stallsData.length} stalls`);
        setStalls(stallsData);
      } catch (error) {
        console.error('❌ Error fetching manager or stalls:', error);
      }
    };

    if (managerId && token) {
      fetchManagerAndStalls();
    }
  }, [managerId, token]);

  // 🧠 Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🖼️ Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, file }));
    console.log('📸 Selected file:', file?.name);
  };

  // ✅ Submit form to create a stall
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.file) {
      alert('⚠️ Please fill all fields and upload an image.');
      return;
    }

    setLoading(true);
    console.log('🚀 Submitting stall creation...');
    try {
      const result = await createStall(
        {
          ...form,
          building_id: buildingId,
          user_id: managerId, // 🧠 or admin_id for admin flow
        },
        token
      );

      console.log('✅ Stall created successfully:', result);
      alert('✅ Stall created successfully!');
      setForm({ name: '', description: '', file: null });

      const updatedStalls = await fetchStallsByBuilding(buildingId, token);
      console.log('🔄 Updated stalls list:', updatedStalls);
      setStalls(updatedStalls);
      setShowForm(false);
    } catch (err) {
      console.error('❌ Stall creation failed:', err.response?.data || err.message);
      alert('❌ Error creating stall. Check logs for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="stall-container">
        <h1 className="stall-heading">Manager - Stall Management</h1>

        <button
          className="toggle-button"
          onClick={() => setShowForm((prev) => !prev)}
        >
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

        <div className="stall-list">
          {stalls.length === 0 ? (
            <p>No stalls found.</p>
          ) : (
            <div className="stalls-grid">
              {stalls.map((stall) => (
                <div key={stall.id} className="stall-card">
                  <img
                    src={`http://localhost:8000/${stall.image_url}`}
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
      </div>
    </AdminLayout>
  );
}
