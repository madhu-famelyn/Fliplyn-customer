// src/api/Service.js
const BASE_URL = 'https://fliplyn.onrender.com'; // 🔒 Hardcoded, no .env fallback

// ✅ Create Building
export const createBuilding = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/buildings/`, {   // ✅ fixed
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create building');
  return res.json();
};
// ✅ Delete Building by ID
export const deleteBuildingById = async (buildingId, token) => {
  const res = await fetch(`${BASE_URL}/buildings/${buildingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Delete failed');
  return true;
};

// ✅ Fetch Buildings by city ID
export const fetchBuildings = async (cityId, token) => {
  const res = await fetch(`${BASE_URL}/buildings?city_id=${cityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
};
