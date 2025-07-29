export const getUserDetails = async (userId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/admin/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

export const fetchBuildings = async (adminId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/buildings/buildings/by-admin/${adminId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
};

export const createManager = async (data, token) => {
  try {
    const res = await fetch('https://fliplyn.onrender.com/managers/', {
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
  const res = await fetch(`https://fliplyn.onrender.com/managers/building/${buildingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch managers');
  return res.json();
};

export const deleteManager = async (managerId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/managers/${managerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete manager');
  return res.json();
};

