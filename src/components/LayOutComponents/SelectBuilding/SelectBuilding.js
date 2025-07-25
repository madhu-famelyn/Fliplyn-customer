import React, { useState } from 'react';
import AdminLayout from '../../LayOut/AdminLayout';
import './SelectBuilding.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContex/ContextAPI';
import { createBuilding } from './Service';

export default function CreateBuilding() {
  const { state } = useLocation(); // must include userId, countryId, stateId, cityId
  const { token } = useAuth();
  const navigate = useNavigate();

  const [buildingName, setBuildingName] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [floorAccess, setFloorAccess] = useState([]);

  const handleFloorChange = (value) => {
    const floors = value
      .split(',')
      .map(f => parseInt(f.trim()))
      .filter(n => !isNaN(n));
    setFloorAccess(floors);
  };

  const handleSubmit = async () => {
    // ✅ Debug: show what's being passed in from previous page
    console.log("DEBUG: state", state);
    console.log("DEBUG: token", token);

    if (!buildingName) {
      alert("Building name is required.");
      return;
    }

    // ✅ FIXED: using state.userId instead of state.adminId
    if (!state?.userId || !state?.countryId || !state?.stateId || !state?.cityId) {
      alert("Missing required location data.");
      return;
    }

    const payload = {
      user_id: state.userId,
      country_id: state.countryId,
      state_id: state.stateId,
      city_id: state.cityId,
      building_name: buildingName,
    };

    if (entryTime || floorAccess.length > 0) {
      payload.user_access = {
        entry_time: entryTime,
        floor_access: floorAccess
      };
    }

    // ✅ Log full payload before sending
    console.log("📦 Sending payload to backend:", JSON.stringify(payload, null, 2));

    try {
      await createBuilding(payload, token);
      navigate('/locations');
    } catch (err) {
      console.error('❌ Error creating building:', err);
      alert("Building creation failed. Check console for details.");
    }
  };

  return (
    <AdminLayout>
      <div className="create-building-container">
        <h2>Create New Building</h2>

        <input
          value={buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
          placeholder="Enter building name"
          className="input-field"
        />

        <input
          value={entryTime}
          onChange={(e) => setEntryTime(e.target.value)}
          placeholder="Entry time (e.g., 9AM)"
          className="input-field"
        />

        <input
          onChange={(e) => handleFloorChange(e.target.value)}
          placeholder="Floors (comma separated, e.g., 1,2,3)"
          className="input-field"
        />

        <button className="submit-btn" onClick={handleSubmit}>Create Building</button>
      </div>
    </AdminLayout>
  );
}
