// src/services/walletService.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // Update this to your API URL

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
    const response = await fetch(`https://fliplyn.onrender.com/buildings/buildings/by-admin/${adminId}`, {
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
  const res = await fetch(`http://127.0.0.1:8000/wallets/by-building/${buildingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch wallets');
  return await res.json();
};


export const fetchUserById = async (userId, token) => {
  const response = await fetch(`${process.env.REACT_APP_BASE_URL}/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  return await response.json();
};
