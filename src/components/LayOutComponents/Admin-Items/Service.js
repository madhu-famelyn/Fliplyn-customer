// src/services/buildingService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // 🔁 Replace with your actual backend URL

export const fetchBuildingsByAdminId = async (adminId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/buildings/buildings/by-admin/${adminId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw error.response?.data || error;
  }
};

// ✅ NEW: Fetch stalls by building ID
export const fetchStallsByBuildingId = async (buildingId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stalls/building/${buildingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stalls:', error);
    throw error.response?.data || error;
  }
};


export const fetchItemsByStallId = async (stallId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/stall/${stallId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items by stall ID:', error);
    throw error.response?.data || error;
  }
};