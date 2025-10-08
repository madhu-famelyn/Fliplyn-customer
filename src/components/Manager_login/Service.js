// Service.js
import axios from 'axios';

export const loginManager = async (credentials) => {
  const response = await axios.post(
    'http://127.0.0.1:8000/manager/login',
    {
      email: credentials.email,  // ✅ match backend schema
      password: credentials.password
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};
