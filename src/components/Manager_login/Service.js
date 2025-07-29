// Service.js
import axios from 'axios';

export const loginManager = async (credentials) => {
  const response = await axios.post('https://fliplyn.onrender.com/manager/login', credentials);
  return response.data; // ✅ important
};
