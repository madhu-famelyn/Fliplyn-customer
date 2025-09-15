// src/services/walletService.js
import axios from "axios";

// ✅ Use environment variable for base URL
const API_BASE = import.meta.env.VITE_API_URL;

// ✅ Service to fetch wallet groups by HR ID
export const getWalletGroupsByHrId = async (hrId, token) => {
  try {
    const response = await axios.get(`${API_BASE}/hr/get-wallet/${hrId}`, {
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

// ✅ Service to create wallet group via Excel upload
export const uploadWalletGroupExcel = (formData, token) => {
  return axios.post(`${API_BASE}/wallet-group/upload-excel/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
