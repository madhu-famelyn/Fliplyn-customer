import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import axios from "axios";
import "./CreateStall.css";

export default function AddStall() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Convert 24-hour time (HH:MM) to 12-hour AM/PM format
  const formatTimeToAMPM = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; // convert 0 => 12
    return `${h.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const adminId = user?.admin_id;
    const managerId = user?.id;
    const buildingId = user?.building_id;

    if (!adminId || !managerId || !buildingId) {
      alert("Missing required user details (admin_id / manager_id / building_id).");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("building_id", buildingId);
    formData.append("admin_id", adminId);
    formData.append("manager_id", managerId);
    formData.append("opening_time", formatTimeToAMPM(openingTime));
    formData.append("closing_time", formatTimeToAMPM(closingTime));
    formData.append("is_available", isAvailable);
    if (file) formData.append("file", file);

    // Log form data for debugging
    console.log("🔹 Sending form data:");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const res = await axios.post(
        "https://admin-aged-field-2794.fly.dev/stalls/", // replace with your real API URL
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 200 || res.status === 201) {
        alert("Stall created successfully!");
        navigate("/manager-stalls");
      }
    } catch (error) {
      console.error("❌ Error creating stall:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create stall");
    }
  };

  return (
    <div className="add-stall-container">
      <h2>Create New Stall</h2>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          placeholder="Stall Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <p>Opening Time</p>
        <input
          type="time"
          value={openingTime}
          onChange={(e) => setOpeningTime(e.target.value)}
        />

        <p>Closing Time</p>
        <input
          type="time"
          value={closingTime}
          onChange={(e) => setClosingTime(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          Is Available
        </label>

        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button type="submit">Create Stall</button>
      </form>
    </div>
  );
}
