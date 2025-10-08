// src/services/buildingService.js
import axios from 'axios';

const API_BASE_URL = 'https://fliplyn.onrender.com/'; // ✅ Use this consistently

// ✅ Fetch buildings by admin ID

// ✅ Update stall availability
export const updateStallAvailability = async (stallId, isAvailable) => {
  const response = await fetch(`${API_BASE_URL}/stalls/${stallId}/availability`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_available: isAvailable }),
  });

  if (!response.ok) {
    throw new Error("Failed to update stall availability");
  }
  return response.json();
};


export const fetchBuildingsByAdminId = async (adminId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/buildings/buildings/by-admin/${adminId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw error.response?.data || error;
  }
};

// ✅ Fetch stalls by building ID
export const fetchStallsByBuildingId = async (buildingId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stalls/building/${buildingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stalls:', error);
    throw error.response?.data || error;
  }
};

// ✅ Fetch items by stall ID
export const fetchItemsByStallId = async (stallId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/stall/${stallId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items by stall ID:', error);
    throw error.response?.data || error;
  }
};

// ✅ Update item availability (PATCH)
export const updateItemAvailability = async (itemId, isAvailable) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/items/items/${itemId}/availability`,
      { is_available: isAvailable }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating item availability:', error);
    throw error.response?.data || error;
  }
};

// ✅ Update item (PUT)
export const updateItem = async (itemId, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/items/${itemId}`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error.response?.data || error;
  }
};

// ✅ Delete item (DELETE)
export const deleteItemById = async (itemId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error.response?.data || error;
  }
};
