import React, { useEffect, useState } from 'react';
import {
  fetchBuildingsByAdminId,
  fetchStallsByBuildingId,
  fetchItemsByStallId,
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';

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

  if (loading) return <p>Loading buildings, stalls, and items...</p>;

  return (
    <div>
      <h2>Your Buildings, Stalls, and Items</h2>
      {buildingsWithStalls.length === 0 ? (
        <p>No buildings found.</p>
      ) : (
        <ul>
          {buildingsWithStalls.map((building) => (
            <li key={building.id} style={{ marginBottom: '20px' }}>
              <strong>{building.building_name}</strong> - {building.city_name}, {building.state_name}
              <ul style={{ marginLeft: '20px' }}>
                {building.stalls.length > 0 ? (
                  building.stalls.map((stall) => (
                    <li key={stall.id} style={{ marginTop: '10px' }}>
                      🏪 <strong>{stall.name}</strong>
                      <ul style={{ marginLeft: '20px' }}>
                        {stall.items && stall.items.length > 0 ? (
                          stall.items.map((item) => (
                            <li key={item.id}>
                              🍽️ {item.name} - ₹{item.price}
                            </li>
                          ))
                        ) : (
                          <li>No items in this stall.</li>
                        )}
                      </ul>
                    </li>
                  ))
                ) : (
                  <li>No stalls in this building.</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminItems;
