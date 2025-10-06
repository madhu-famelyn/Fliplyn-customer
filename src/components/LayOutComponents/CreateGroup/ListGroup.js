import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContex/ContextAPI';
import { FaEdit } from 'react-icons/fa'; // 🆕 Edit Icon

const WalletGroupList = () => {
  const { userId: adminId, token } = useAuth();

  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!adminId) return;

      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBuildings(res.data || []);
        if (res.data.length > 0) {
          setBuildingId(res.data[0].id);
        }
      } catch (err) {
        console.error('❌ Failed to fetch buildings:', err);
      }
    };

    fetchBuildings();
  }, [adminId, token]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!buildingId) return;

      setLoading(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/wallet-groups/by-building/${buildingId}`
        );
        setGroups(res.data || []);
      } catch (error) {
        console.error('❌ Error fetching wallet groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [buildingId]);

  const handleBuildingChange = (e) => {
    setBuildingId(e.target.value);
  };

  const handleEdit = (groupId) => {
    console.log("Edit group:", groupId);
    // TODO: open modal or navigate to edit page
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f7f7f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Wallet Groups</h2>

      {buildings.length > 1 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>Select Building:</label>
          <select
            value={buildingId}
            onChange={handleBuildingChange}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
            }}
          >
            <option value="">Select a building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.building_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p>Loading wallet groups...</p>
      ) : groups.length === 0 ? (
        <p>No wallet groups found for this building.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {groups.map((group) => (
            <li
              key={group.id}
              style={{
                position: 'relative', // Required for icon positioning
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* 🖉 Edit Icon in top-right */}
              
              <strong style={{ fontSize: '16px', color: '#e68a00' }}>
                {group.group_name || 'Unnamed Group'}
              </strong>
              <p style={{ margin: '5px 0' }}>
                <strong>Group ID:</strong> {group.id}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Users:</strong> {group.users?.length || 0}
              </p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#555' }}>
                <strong>Created:</strong>{' '}
                {new Date(group.created_datetime).toLocaleString()}
              </p>
              <p>Edit</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WalletGroupList;
