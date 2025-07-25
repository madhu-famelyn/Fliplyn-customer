// src/services/walletService.js
import axios from 'axios';

const BASE_URL = 'https://fliplyn.onrender.com'; // Update this to your API URL

export const addMoneyToWallet = async (payload, token) => {
  const response = await axios.post(`${BASE_URL}/wallets/add-money`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};



export const fetchBuildings = async (adminId, token) => {
  console.log("📡 Calling fetchBuildings with adminId:", adminId);
  const res = await fetch(`https://fliplyn.onrender.com/buildings/buildings/by-admin/${adminId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Backend responded with error:', errorText);
    throw new Error('Failed to fetch buildings');
  }

  return res.json();
};


// Add this in Service.js
export async function fetchWalletsByBuilding(buildingId, token) {
  const response = await fetch(`https://fliplyn.onrender.com/wallets/by-building/${buildingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch wallets');
  }
  return await response.json();
}

export const fetchUserDetails = async (userId, token) => {
  const response = await axios.get(`/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
