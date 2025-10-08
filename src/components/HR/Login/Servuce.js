import axios from "axios";

const API_URL = "http://127.0.0.1:8000/hr/auth"; // adjust if backend is deployed

// HR Login API
export const hrLogin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; // contains { access_token, token_type, hr }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || "Login failed");
    }
    throw new Error("Network error. Please try again.");
  }
};
