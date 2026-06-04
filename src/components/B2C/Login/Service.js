import axios from "axios";

const API_BASE =
  window.location.hostname === "localhost"
    ? `http://${window.location.hostname}:8000`
    : "https://admin-aged-field-2794.fly.dev";

// B2C / User Login API
// Endpoint: POST /user/login
// Payload:  { company_email: string, password: string }
export const b2cLogin = async ({ company_email, password }) => {
  try {
    const response = await axios.post(
      `${API_BASE}/user/login`,
      { company_email, password },
      { headers: { "Content-Type": "application/json" } }
    );
    // Response: { access_token, token_type, user: { id, name, email, phone_number, company_name } }
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || "Login failed");
    }
    throw new Error("Network error. Please try again.");
  }
};
