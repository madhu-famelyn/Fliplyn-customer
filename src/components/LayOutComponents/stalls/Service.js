// src/pages/stalls/Service.js
import axios from 'axios';

// Base URL for the backend API
const API_BASE = 'https://admin-aged-field-2794.fly.dev/';

// ====================
// Fetch buildings by admin ID
// ====================
export const fetchBuildings = async (adminId, token) => {
  try {
    // Corrected path: /stalls/buildings/by-admin/:adminId
    const res = await axios.get(`${API_BASE}buildings/buildings/by-admin/${adminId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error('❌ Backend responded with error:', error.response?.data || error.message);
    throw new Error('Failed to fetch buildings');
  }
};

// ====================
// Create a new stall
// ====================
export const createStall = async (formData, token) => {
  try {
    const res = await axios.post(`${API_BASE}stalls/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Stall create error response:", err.response?.data || err.message);
    throw new Error("Failed to create stall");
  }
};

// ====================
// Fetch stalls by building ID
// ====================
export const fetchStallsByBuilding = async (buildingId, token) => {
  try {
    // Use the backend's correct GET endpoint
    const res = await axios.get(`${API_BASE}stalls/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error('❌ Failed to fetch stalls:', error.response?.data || error.message);
    throw new Error('Failed to fetch stalls');
  }
};


// ====================
// Delete stall by ID
// ====================
export const deleteStall = async (stallId, token) => {
  try {
    console.log("🗑 Deleting Stall ID:", stallId);
    const res = await axios.delete(`${API_BASE}${stallId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Stall deleted successfully:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error deleting stall:", error.response?.data || error.message);
    throw error;
  }
};

// ====================
// Update a stall by ID
// ====================
export const updateStall = async (stallId, stallData, token) => {
  try {
    const formData = new FormData();

    if (stallData.name) formData.append("name", stallData.name);
    if (stallData.description) formData.append("description", stallData.description);
    if (stallData.file) formData.append("file", stallData.file);
    if (stallData.admin_id) formData.append("admin_id", stallData.admin_id);
    if (stallData.building_id) formData.append("building_id", stallData.building_id);
    if (stallData.manager_id) formData.append("manager_id", stallData.manager_id);
    if (stallData.is_available !== undefined)
      formData.append("is_available", stallData.is_available ? "true" : "false");

    // Add opening and closing time if provided
    if (stallData.opening_time !== undefined) formData.append("opening_time", stallData.opening_time);
    if (stallData.closing_time !== undefined) formData.append("closing_time", stallData.closing_time);

    const res = await axios.put(`${API_BASE}${stallId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Stall update failed:", error.response?.data || error.message);
    throw new Error("Failed to update stall");
  }
};









export const editStallBasic = async (stallId, formData, token) => {
  const response = await axios.put(
    `${API_BASE}stalls/${stallId}/edit-basic`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};