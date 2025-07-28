// Service.js
import axios from 'axios';

export const loginManager = async (credentials) => {
  const response = await axios.post('http://localhost:8000/manager/login', credentials);
  return response.data; // ✅ important
};
