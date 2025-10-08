const BASE_URL = 'http://127.0.0.1:8000/'; // Replace if different

export const fetchManagerById = async (managerId, token) => {
  const res = await fetch(`${BASE_URL}/managers/${managerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch manager');
  return res.json();
};

export const fetchStallsByBuilding = async (buildingId, token) => {
  const res = await fetch(`${BASE_URL}/stalls/building/${buildingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch stalls');
  return res.json();
};

export const fetchItemsByStallId = async (stallId, token) => {
  const res = await fetch(`${BASE_URL}/items/stall/${stallId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
};
