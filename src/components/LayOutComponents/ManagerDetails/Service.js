// src/services/managerService.js

const BASE_URL = 'https://fliplyn.onrender.com'; // Replace with your backend URL

export const fetchManagerById = async (managerId, token) => {
  const response = await fetch(`${BASE_URL}/managers/${managerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch manager');
  return response.json();
};

export const fetchAdminById = async (adminId, token) => {
  const response = await fetch(`${BASE_URL}/admin/${adminId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch admin');
  return response.json();
};

export const fetchBuildingById = async (buildingId, token) => {
  const response = await fetch(`${BASE_URL}/buildings/${buildingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch building');
  return response.json();
};
