export const getUserDetails = async (userId, token) => {
  const res = await fetch(`https://admin-aged-field-2794.fly.dev/admin/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

export const fetchBuildings = async (adminId, token) => {
  const res = await fetch(`/buildings/buildings/by-admin/${adminId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
};

export const createManager = async (data, token) => {
  try {
    const res = await fetch('https://admin-aged-field-2794.fly.dev/managers/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text(); // 🟡 log full error
      console.error('Backend responded with error:', errorText);
      throw new Error(errorText || 'Failed to create manager');
    }

    return await res.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};


export const fetchManagersByBuilding = async (buildingId, token) => {
  const res = await fetch(`https://admin-aged-field-2794.fly.dev/managers/building/${buildingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch managers');
  return res.json();
};

export const deleteManager = async (managerId, token) => {
  const res = await fetch(`https://admin-aged-field-2794.fly.dev/managers/${managerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete manager');
  return res.json();
};

