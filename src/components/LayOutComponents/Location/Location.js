import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContex/AdminContext';
import AdminLayout from '../../LayOut/AdminLayout';
import './Locations.css';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { IoMdAdd } from 'react-icons/io';

export default function Locations() {
  const { adminId, token } = useAuth(); // ✅ use adminId instead of userId
  const [buildings, setBuildings] = useState([]);
  const [, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Locations component mounted');
    console.log('Auth state:', { adminId, token });

    // fallback to localStorage if context is empty
    const storedAdminId = adminId || localStorage.getItem('adminId');
    const storedToken = token || localStorage.getItem('token');

    if (!storedAdminId || !storedToken) {
      console.warn('⚠️ Missing adminId or token, skipping fetch', { storedAdminId, storedToken });
      setLoading(false);
      return;
    }

    console.log('✅ Using adminId:', storedAdminId);
    console.log('✅ Using token:', storedToken);

    const fetchData = async () => {
      try {
        const [buildingsRes, countriesRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/buildings/buildings/by-admin/${storedAdminId}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
          fetch(`http://127.0.0.1:8000/locations/countries`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
        ]);

        const buildingsData = await buildingsRes.json();
        const countriesData = await countriesRes.json();

        setBuildings(buildingsData);
        setCountries(Array.isArray(countriesData.data) ? countriesData.data : []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminId, token]);

  const handleCardClick = (buildingId) => {
    console.log('Clicked building:', buildingId);
    // navigate(`/locations/${buildingId}`);
  };

  const handleDelete = async (buildingId) => {
    if (!window.confirm('Are you sure you want to delete this building?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/buildings/${buildingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBuildings((prev) => prev.filter((b) => b.id !== buildingId));
        console.log('Building deleted:', buildingId);
      } else {
        const text = await res.text();
        console.error('Failed to delete building:', res.status, text);
      }
    } catch (err) {
      console.error('Error deleting building:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="locations-container">
        <div className="locations-header">
          <h1>Locations</h1>
          <button className="add-location-btn" onClick={() => navigate('/select-country')}>
            <IoMdAdd size={18} /> Add Location
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="locations-grid">
            {buildings.map((b) => (
              <div
                key={b.id}
                className="location-card card-clickable"
                onClick={() => handleCardClick(b.id)}
              >
                <div className="card-header">
                  <h3>{b.building_name}</h3>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <FiEdit2 className="icon edit-icon" />
                    <FiTrash2 className="icon delete-icon" onClick={() => handleDelete(b.id)} />
                  </div>
                </div>
                <p><strong>Country:</strong> {b.country_name}</p>
                <p><strong>State:</strong> {b.state_name || 'N/A'}</p>
                <p><strong>City:</strong> {b.city_name || 'N/A'}</p>
                <p><strong>Floor Access:</strong> {b.user_access?.floor_access?.join(', ') || 'N/A'}</p>
                <p><strong>Managers Count:</strong> {b.managers?.length || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
