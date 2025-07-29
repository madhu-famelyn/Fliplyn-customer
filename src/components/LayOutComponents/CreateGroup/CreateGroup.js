import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import './CreateGroup.css';

export default function CreateGroup() {
  const { userId, token } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState(['']);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/buildings/buildings/by-admin/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBuildings(res.data);
        if (res.data.length > 0) {
          setSelectedBuildingId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch buildings:', err);
      }
    };

    fetchBuildings();
  }, [userId, token]);

  // Handle phone number changes
  const handlePhoneChange = (index, value) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  const addPhoneField = () => setPhoneNumbers([...phoneNumbers, '']);
  const removePhoneField = (index) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      group_name: groupName,
      building_id: selectedBuildingId,
      user_phone_numbers: phoneNumbers.filter((num) => num.trim() !== ''),
    };

    try {
      await axios.post('http://127.0.0.1:8000/group/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      alert('Group created successfully!');
      setGroupName('');
      setPhoneNumbers(['']);
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Failed to create group.');
    }
  };

  return (
    <AdminLayout>
      <div className="create-group-container">
        <h2 className="create-group-heading">Create New Group</h2>
        <form onSubmit={handleSubmit} className="create-group-form">
          <label className="group-label">Group Name:</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-input"
            required
          />

          <label className="group-label">Select Building:</label>
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="group-select"
            required
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.building_name}
              </option>
            ))}
          </select>

          <label className="group-label">User Phone Numbers:</label>
          {phoneNumbers.map((num, index) => (
            <div key={index} className="phone-field">
              <input
                type="text"
                value={num}
                onChange={(e) => handlePhoneChange(index, e.target.value)}
                placeholder="Enter phone number"
                className="group-input"
                required
              />
              {phoneNumbers.length > 1 && (
                <button
                  type="button"
                  className="remove-phone-btn"
                  onClick={() => removePhoneField(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="add-phone-btn"
            onClick={addPhoneField}
          >
            + Add Phone Number
          </button>

          <button type="submit" className="create-group-submit">
            Create Group
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
