// src/pages/ManagerDetails.js

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContex/ContextAPI';
import {
  fetchManagerById,
  fetchAdminById,
  fetchBuildingById,
} from './Service';
import AdminLayout from '../../LayOut/AdminLayout';
import './ManagerDetails.css';

export default function ManagerDetails() {
  const { userId, token, role } = useAuth();

  const [manager, setManager] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [otherManagers, setOtherManagers] = useState([]);

  useEffect(() => {
    if (userId && role === 'manager') {
      fetchManagerById(userId, token)
        .then((managerData) => {
          setManager(managerData);

          return fetchAdminById(managerData.admin_id, token)
            .then((adminData) => {
              setAdmin(adminData);
              return fetchBuildingById(managerData.building_id, token);
            })
            .then((buildingData) => {
              const filtered = buildingData.managers.filter(
                (m) => m.id !== userId
              );
              setOtherManagers(filtered);
            });
        })
        .catch((err) => {
          console.error('Error loading manager details:', err);
        });
    }
  }, [userId, token, role]);

  return (
    <AdminLayout>
      <div className="manager-container">
        <h1 className="page-title">Manager Dashboard</h1>

        {admin && (
          <section className="section">
            <h2 className="section-title">Admin Details</h2>
            <div className="card">
              <p><strong>Name:</strong> {admin.name}</p>
              <p><strong>Email:</strong> {admin.email}</p>
              <p><strong>Phone:</strong> {admin.phone_number}</p>
            </div>
          </section>
        )}

        {manager && (
          <section className="section">
            <h2 className="section-title">Your Manager Profile</h2>
            <div className="card">
              <p><strong>Name:</strong> {manager.name}</p>
              <p><strong>Email:</strong> {manager.email}</p>
              <p><strong>Phone:</strong> {manager.phone_number}</p>
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section-title">Other Managers in the Same Building</h2>
          {otherManagers.length > 0 ? (
            <ul className="manager-list">
              {otherManagers.map((m) => (
                <li key={m.id}>
                  {m.name} ({m.email}, {m.phone_number})
                </li>
              ))}
            </ul>
          ) : (
            <p className="only-manager-message">You are the only manager in this building.</p>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
