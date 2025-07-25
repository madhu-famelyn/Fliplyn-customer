// src/services/countryService.js
import axios from 'axios';

const API_BASE_URL = 'https://fliplyn.onrender.com';

export const createCountrySelection = async (adminId, selectedCountry, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/country/`,
    {
      admin_id: adminId,
      selected_country: selectedCountry,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
