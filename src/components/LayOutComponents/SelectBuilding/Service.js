const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://fliplyn.onrender.com'; // fallback if undefined

export const createBuilding = async (payload, token) => {
  const res = await fetch(`${BASE_URL}/buildings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create building');
  return res.json();
};



export const deleteBuildingById = async (buildingId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/buildings/${buildingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Delete failed');
  return true;
};

export const fetchBuildings = async (cityId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/buildings?city_id=${cityId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
};
