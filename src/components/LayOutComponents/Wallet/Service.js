// src/services/walletService.js
import axios from 'axios';

const BASE_URL = 'https://admin-aged-field-2794.fly.dev'; // Update this to your API URL

export const addMoneyToWallet = async (payload, token) => {
  const response = await axios.post(`${BASE_URL}/wallets/add-money`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchBuildingByAdminId = async (adminId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/buildings/buildings/buildings/by-admin/${adminId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch building data.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchWalletsByBuildingId = async (buildingId, token) => {
  const res = await fetch(`${BASE_URL}/wallets/by-building/${buildingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch wallets');
  return await res.json();
};

// ---------------------- New Function ----------------------
export const getAllWalletsByBuildingId = async (buildingId, token) => {
  try {
    const res = await fetch(`${BASE_URL}/wallets/building/${buildingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch all wallets with user info');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchUserById = async (userId, token) => {
  const res = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user details');
  return await res.json();
};
