// Service.js
import axios from 'axios';

export const loginManager = async (credentials) => {
  const response = await axios.post(
    'https://admin-aged-field-2794.fly.dev/manager/login',
    {
      email: credentials.email,  // ✅ match backend schema
      password: credentials.password
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};
