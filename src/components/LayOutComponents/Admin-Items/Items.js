import React, { useEffect, useState } from 'react';
import AdminLayout from '../../LayOut/AdminLayout';
import {
  fetchBuildingsByAdminId,
  fetchStallsByBuildingId,
  fetchItemsByStallId,
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import './Items.css';

const AdminItems = () => {
  const { userId, role } = useAuth();
  const [buildingsWithStalls, setBuildingsWithStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuildingsStallsItems = async () => {
      try {
        if (userId && role === 'admin') {
          const buildings = await fetchBuildingsByAdminId(userId);

          const buildingPromises = buildings.map(async (building) => {
            const stalls = await fetchStallsByBuildingId(building.id);
            const stallPromises = stalls.map(async (stall) => {
              const items = await fetchItemsByStallId(stall.id);
              return { ...stall, items };
            });

            const stallsWithItems = await Promise.all(stallPromises);
            return { ...building, stalls: stallsWithItems };
          });

          const fullData = await Promise.all(buildingPromises);
          setBuildingsWithStalls(fullData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load buildings, stalls, or items', err);
        setLoading(false);
      }
    };

    loadBuildingsStallsItems();
  }, [userId, role]);

  return (
    <AdminLayout>
      <div className="admin-items-container">
        <h2 className="admin-items-title">Your Buildings, Stalls, and Items</h2>
        {loading ? (
          <p className="empty-message">Loading buildings, stalls, and items...</p>
        ) : buildingsWithStalls.length === 0 ? (
          <p className="empty-message">No buildings found.</p>
        ) : (
          buildingsWithStalls.map((building) => (
            <div key={building.id} className="building-card">
              <div className="building-name">
                {building.building_name} – {building.city_name}, {building.state_name}
              </div>
              {building.stalls.length > 0 ? (
                building.stalls.map((stall) => (
                  <div key={stall.id} className="stall-item">
                    <div className="stall-name">🏪 {stall.name}</div>
                    {stall.items && stall.items.length > 0 ? (
                      stall.items.map((item) => (
                        <div key={item.id} className="item">
                          🍽️ {item.name} – ₹{item.price}
                        </div>
                      ))
                    ) : (
                      <div className="empty-message">No items in this stall.</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-message">No stalls in this building.</div>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminItems;
