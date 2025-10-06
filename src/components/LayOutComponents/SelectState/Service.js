// src/services/StateService.js
import axios from 'axios';

const API_BASE_URL = '';

export const createStateSelection = async (vendorId, countryId, stateName, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/states/`,
    {
      vendor_id: vendorId,
      country_id: countryId,
      state_name: stateName,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
