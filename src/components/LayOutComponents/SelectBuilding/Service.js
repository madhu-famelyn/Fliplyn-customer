// src/api/Service.js

// ✅ Use environment variable if available, otherwise fallback to hardcoded HTTPS
const BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://admin-aged-field-2794.fly.dev'
).replace(/^http:/, 'https:');

// ✅ Helper to handle fetch requests with error checking
const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  } catch (err) {
    console.error('Fetch Error:', err);
    throw err;
  }
};

// ✅ Create Building
export const createBuilding = async (payload, token) => {
  return request(`${BASE_URL}/buildings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};

// ✅ Delete Building by ID
export const deleteBuildingById = async (buildingId, token) => {
  await request(`${BASE_URL}/buildings/${buildingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return true;
};

// ✅ Fetch Buildings by city ID
export const fetchBuildings = async (cityId, token) => {
  return request(`${BASE_URL}/buildings?city_id=${cityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
