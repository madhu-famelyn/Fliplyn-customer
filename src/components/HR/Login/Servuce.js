// src/services/hrService.js
import axios from "axios";

// Use environment variable for base URL
const API_BASE = import.meta.env.VITE_API_URL; 

// HR Login API
export const hrLogin = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE}/hr/auth/login`, credentials, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; // { access_token, token_type, hr }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || "Login failed");
    }
    throw new Error("Network error. Please try again.");
  }
};

