// src/pages/Service.js
import axios from 'axios';

export const fetchCitiesByCountryState = async (country, state) => {
  const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, state }),
  });

  const data = await response.json();
  return data.data || [];
};

const BASE_URL = 'https://admin-aged-field-2794.fly.dev'; // ✅ Add your backend URL

export const createCity = async (cityData, token) => {
  const response = await axios.post(`${BASE_URL}/cities/`, cityData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};
