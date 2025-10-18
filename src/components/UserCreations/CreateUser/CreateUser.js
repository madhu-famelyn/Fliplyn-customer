import React, { useState } from "react";
import axios from "axios";
import "./CreateUser.css"; // optional styling file

export default function CreateUserAdmin() {
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    company_email: "",
    phone_number: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post("https://admin-aged-field-2794.fly.dev/signup", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setMessage("✅ User registered successfully!");
      console.log("Response:", response.data);

      // Reset form
      setFormData({
        name: "",
        company_name: "",
        company_email: "",
        phone_number: "",
        password: "",
      });
    } catch (error) {
      console.error("Error creating user:", error.response?.data || error.message);
      setMessage(error.response?.data?.detail || "❌ Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-container">
      <h2>Create New User</h2>

      <form className="create-user-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="company_name"
          placeholder="Company Name"
          value={formData.company_name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="company_email"
          placeholder="Company Email"
          value={formData.company_email}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>

      {message && <p className="response-message">{message}</p>}
    </div>
  );
}
