// src/services/walletService.js
import axios from "axios";

const API_BASE = "https://fliplyn.onrender.com/"; // adjust if backend runs on another host

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
