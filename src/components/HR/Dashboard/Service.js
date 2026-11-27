// src/services/walletService.js
import axios from "axios";

const API_BASE = "https://admin-aged-field-2794.fly.dev/"; // adjust if backend runs on another host

// ✅ Service to fetch wallet groups by HR ID
export const getWalletGroupsByHrId = async (hrId, token) => {
  try {
    const response = await axios.get(`${API_BASE}hr/get-wallet/${hrId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // ✅ Ensure response is always an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error("❌ Failed to fetch wallet groups:", error);
    return [];
  }
};

// ✅ Read-only balance summary for the logged-in HR's wallet groups
export const getHrGroupBalances = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}wallet-group-balance/hr`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.groups || [];
  } catch (error) {
    console.error("❌ Failed to fetch wallet group balances:", error);
    return [];
  }
};

// ✅ Individual member wallets for one of the HR's wallet groups
export const getHrGroupMemberBalances = async (groupId, token) => {
  try {
    const response = await axios.get(`${API_BASE}wallet-group-balance/hr/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.members || [];
  } catch (error) {
    console.error("❌ Failed to fetch member balances:", error);
    return [];
  }
};
