   // Service.js
import axios from 'axios';

const BASE_URL = 'https://fliplyn.onrender.com'; // Update if your FastAPI server is on a different port

// Create a new item
export const createItem = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/items/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const getItemsByCategoryId = async (categoryId) => {
  try {
    const response = await axios.get(`${BASE_URL}/items/items/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items by category:', error);
    throw error;
  }
};

// Update item availability
export const updateItemAvailability = async (itemId, isAvailable) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/items/items/${itemId}/availability`,
      { is_available: isAvailable }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating item availability:', error);
    throw error;
  }
};

export const deleteItemById = async (itemId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/items/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};