// src/services/categoryService.js
import axios from 'axios';

// ✅ Use environment variable for base URL
const BASE_URL = import.meta.env.VITE_API_URL;

// ✅ Create a new category
export const createCategory = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/categories/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error.response?.data || error;
  }
};

// ✅ Fetch categories by stall ID
export const fetchCategoriesByStall = async (stallId) => {
  try {
    const response = await axios.get(`${BASE_URL}/categories/stall/${stallId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error.response?.data || error;
  }
};

// ✅ Update category
export const updateCategory = async (categoryId, formData) => {
  try {
    const response = await axios.put(`${BASE_URL}/categories/${categoryId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error.response?.data || error;
  }
};
