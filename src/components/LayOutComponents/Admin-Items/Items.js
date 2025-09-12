import { useEffect, useState } from 'react';
import AdminLayout from '../../LayOut/AdminLayout';
import {
  fetchBuildingsByAdminId,
  fetchStallsByBuildingId,
  fetchItemsByStallId,
  updateItemAvailability,
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import './Items.css';

const AdminItems = () => {
  const { userId, role } = useAuth();
  const [buildings, setBuildings] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedStallId, setSelectedStallId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        if (userId && role === 'admin') {
          const result = await fetchBuildingsByAdminId(userId);
          setBuildings(result);
        }
      } catch (err) {
        console.error('Failed to load buildings', err);
      } finally {
        setLoading(false);
      }
    };
    loadBuildings();
  }, [userId, role]);

  useEffect(() => {
    const loadStallsAndItems = async () => {
      if (selectedBuildingId) {
        setLoading(true);
        try {
          const stallsData = await fetchStallsByBuildingId(selectedBuildingId);
          setStalls(stallsData);
          setSelectedStallId('');
          const allItems = [];

          for (const stall of stallsData) {
            const stallItems = await fetchItemsByStallId(stall.id);
            stallItems.forEach(item => {
              allItems.push({ ...item, stallName: stall.name });
            });
          }
          setItems(allItems);
        } catch (err) {
          console.error('Failed to load stalls or items', err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadStallsAndItems();
  }, [selectedBuildingId]);

  useEffect(() => {
    const loadSingleStallItems = async () => {
      if (selectedStallId) {
        setLoading(true);
        try {
          const stallItems = await fetchItemsByStallId(selectedStallId);
          const stall = stalls.find(s => s.id === selectedStallId);
          const labeledItems = stallItems.map(item => ({
            ...item,
            stallName: stall?.name || '',
          }));
          setItems(labeledItems);
        } catch (err) {
          console.error('Failed to load items for stall', err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (selectedStallId) loadSingleStallItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStallId]);

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await updateItemAvailability(itemId, !currentStatus);
      if (selectedStallId) {
        const updatedItems = await fetchItemsByStallId(selectedStallId);
        setItems(updatedItems.map(item => ({
          ...item,
          stallName: stalls.find(s => s.id === selectedStallId)?.name || '',
        })));
      } else {
        const refreshedItems = [];
        for (const stall of stalls) {
          const stallItems = await fetchItemsByStallId(stall.id);
          stallItems.forEach(item =>
            refreshedItems.push({ ...item, stallName: stall.name })
          );
        }
        setItems(refreshedItems);
      }
    } catch (error) {
      console.error('Error updating item availability:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-items-wrapper">
        <h2 className="admin-items-heading">Manage Items</h2>

        <div className="admin-dropdown-section">
          <select
            className="admin-dropdown"
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setSelectedStallId('');
              setItems([]);
            }}
          >
            <option value="">Select Building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.building_name} – {building.city_name}, {building.state_name}
              </option>
            ))}
          </select>

          <select
            className="admin-dropdown"
            value={selectedStallId}
            onChange={(e) => setSelectedStallId(e.target.value)}
            disabled={!selectedBuildingId}
          >
            <option value="">All Categories</option>
            {stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                🏪 {stall.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="admin-loading-message">Loading...</p>
        ) : items.length > 0 ? (
          <div className="admin-items-grid">
            {items.map((item) => (
              <div key={item.id} className="admin-item-card">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="admin-item-image"
                  onClick={() => window.open(item.image_url, '_blank')}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/fallback.png';
                  }}
                />
                <div className="admin-item-details">
                  <h4 className="admin-item-title">{item.name}</h4>
                  <p className="admin-item-price">₹{item.final_price}</p>
                  <p className="admin-item-tax">
                    {item.tax_included
                      ? `incl. ${item.Gst_precentage}% GST`
                      : `+ ${item.Gst_precentage}% GST`}
                  </p>
                </div>
                <div className="admin-item-controls">
                  <span
                    className="admin-item-icon"
                    style={{ color: item.is_veg ? 'green' : 'red' }}
                    title={item.is_veg ? 'Veg' : 'Non-Veg'}
                  >
                    ●
                  </span>
                  <label className={`admin-availability-toggle ${item.is_available ? 'on' : 'off'}`}>
                    <input
                      type="checkbox"
                      checked={item.is_available}
                      onChange={() => handleToggleAvailability(item.id, item.is_available)}
                    />
                    <span className="admin-slider" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-empty-message">No items available.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminItems;
