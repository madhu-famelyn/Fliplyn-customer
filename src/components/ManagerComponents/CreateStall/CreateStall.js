import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import axios from "axios";
import "./CreateStall.css"
export default function AddStall() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Get IDs from AuthContext
    const adminId = user?.admin_id;
    const managerId = user?.id;
    const buildingId = user?.building_id;

    if (!adminId || !managerId || !buildingId) {
      alert("Missing required user details (admin_id / manager_id / building_id).");
      return;
    }

    // ✅ Build form data
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("building_id", buildingId);
    formData.append("admin_id", adminId);
    formData.append("manager_id", managerId);
    formData.append("opening_time", openingTime);
    formData.append("closing_time", closingTime);
    formData.append("is_available", isAvailable);
    if (file) {
      formData.append("file", file);
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/stalls/`, // replace with your base URL
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
      console.error("Error creating stall:", error);
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
          placeholder="Opening Time"
        />
        <p>Closing Time</p>
        <input
          type="time"
          value={closingTime}
          onChange={(e) => setClosingTime(e.target.value)}
          placeholder="Closing Time"
        />

        <label>
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          Is Available
        </label>

        <input type="file" onChange={handleFileChange} />

        <button type="submit">Create Stall</button>
      </form>
    </div>
  );
}
