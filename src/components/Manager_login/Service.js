// Service.js
import axios from 'axios';

export const loginManager = async (credentials) => {
  const response = await axios.post('https://admin-aged-field-2794.fly.dev/manager/login', credentials);
  return response.data; // ✅ important
};



