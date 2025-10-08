import axios from 'axios';

const BASE_URL = 'https://admin-aged-field-2794.fly.dev/';

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



export const updateCategory = async (categoryId, formData) => {
  const res = await axios.put(`https://admin-aged-field-2794.fly.dev/categories/${categoryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
