import axios from 'axios';

const BASE_URL = 'https://fliplyn.onrender.com';

export const createCategory = async (formData) => {
  const response = await axios.post(`${BASE_URL}/categories/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchCategoriesByStall = async (stallId) => {
  const response = await axios.get(`${BASE_URL}/categories/stall/${stallId}`);
  return response.data;
};
