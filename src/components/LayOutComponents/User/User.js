import React, { useEffect, useState } from 'react';
import AdminLayout from '../../LayOut/AdminLayout';
import { useAuth } from '../../AuthContex/ContextAPI';
import {
  getUserDetails,
  fetchBuildings,
  createManager,
  fetchManagersByBuilding,
  deleteManager,
} from './Service';
import { FiTrash2 } from 'react-icons/fi';
import './User.css';

export default function User() {
  const { userId, token } = useAuth();
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    building_id: '',
    password: '',
  });

  useEffect(() => {
    if (userId && token) {
      getUserDetails(userId, token)
        .then(data => {
          setUserData(data);
          return fetchBuildings(userId, token);
        })
        .then(async buildingsData => {
          setBuildings(buildingsData);
          if (buildingsData.length > 0) {
            const firstBuildingId = buildingsData[0].id;
            const managersData = await fetchManagersByBuilding(firstBuildingId, token);
            setManagers(managersData);
          }
        })
        .catch(err => console.error('Error:', err));
    }
  }, [userId, token]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'building_id' && value) {
      try {
        const mgrs = await fetchManagersByBuilding(value, token);
        setManagers(mgrs);
      } catch (err) {
        console.error('Failed to fetch managers for selected building:', err);
        setManagers([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createManager({ ...form, admin_id: userId }, token);
      alert('Manager added successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', phone_number: '', building_id: '', password: '' });

      if (form.building_id) {
        const mgrs = await fetchManagersByBuilding(form.building_id, token);
        setManagers(mgrs);
      }
    } catch (error) {
      console.error('Error creating manager:', error);
      alert('Failed to add manager');
    }
  };

  const handleDeleteClick = (manager) => {
    setSelectedManager(manager);
    setConfirmDeleteModal(true);
  };

  const confirmDeleteManager = async () => {
    try {
      await deleteManager(selectedManager.id, token);
      setManagers(prev => prev.filter(m => m.id !== selectedManager.id));
      setConfirmDeleteModal(false);
      setSelectedManager(null);
    } catch (err) {
      console.error('Error deleting manager:', err);
      alert('Failed to delete manager');
    }
  };

  return (
    <AdminLayout>
      <div className="user-container">
        <div className="user-header">
          <h1>User Details</h1>
          <button className="add-manager-btn" onClick={() => setShowModal(true)}>+ Add Managers</button>
        </div>

        {userData ? (
          <div className="user-info">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Phone:</strong> {userData.phone_number}</p>
          </div>
        ) : (
          <p>Loading user details...</p>
        )}

        <div className="manager-section">
          <h2>Managers</h2>
          {managers.length > 0 ? (
            <div className="manager-cards">
              {managers.map(m => (
                <div className="manager-card" key={m.id}>
                  <div className="manager-card-header">
                    <h3>{m.name}</h3>
                    <FiTrash2 className="delete-icon" onClick={() => handleDeleteClick(m)} />
                  </div>
                  <p><strong>Email:</strong> {m.email}</p>
                  <p><strong>Phone:</strong> {m.phone_number}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No managers found for selected building.</p>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Manager</h2>
              <form onSubmit={handleSubmit}>
                <input name="name" placeholder="Name" onChange={handleChange} value={form.name} required />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} value={form.email} required />
                <input name="phone_number" placeholder="Phone Number" onChange={handleChange} value={form.phone_number} required />
                <select name="building_id" onChange={handleChange} value={form.building_id} required>
                  <option value="">-- Select Building --</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.building_name || b.name || 'Unnamed Building'}
                    </option>
                  ))}
                </select>
                <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} required />
                <div className="modal-actions">
                  <button type="submit">Add</button>
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete <strong>{selectedManager?.name}</strong>?</p>
              <div className="modal-actions">
                <button onClick={confirmDeleteManager}>Yes, Delete</button>
                <button onClick={() => setConfirmDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
