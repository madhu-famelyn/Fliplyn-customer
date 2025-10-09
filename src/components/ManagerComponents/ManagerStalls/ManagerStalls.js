import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import "./ManagerStalls.css";

export default function ManagerEditStall() {
  const { user } = useAuth();
  const [stallData, setStallData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStall, setEditingStall] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    opening_time: "",
    closing_time: "",
    is_available: true,
    image: null,
  });
  const navigate = useNavigate();

useEffect(() => {
  if (!user) return; // Wait until user is loaded

  const fetchStalls = async () => {
    if (!user?.building_id) {
      setError("Building ID not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
      );
      setStallData(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stalls.");
    } finally {
      setLoading(false);
    }
  };

  fetchStalls();
}, [user]);

  const handleEditClick = (stall) => {
    setEditingStall(stall.id);
    setFormData({
      name: stall.name,
      description: stall.description,
      opening_time: stall.opening_time
        ? new Date(`1970-01-01T${stall.opening_time}`).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      closing_time: stall.closing_time
        ? new Date(`1970-01-01T${stall.closing_time}`).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      is_available: stall.is_available,
      image: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStall) return;

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("opening_time", formData.opening_time);
    form.append("closing_time", formData.closing_time);
    form.append("is_available", formData.is_available);
    if (formData.image) form.append("file", formData.image);

    console.log("🔹 Sending form data:");
    for (const [key, value] of form.entries()) {
      console.log(key, value);
    }

    try {
      const response = await axios.put(
        `https://admin-aged-field-2794.fly.dev/stalls/${editingStall}/edit-basic`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("✅ Response:", response.data);
      alert("Stall updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Error updating stall:", err.response?.data || err.message);
      alert("Failed to update stall.");
    }
  };

  if (loading) return <p>Loading stalls...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="ms-wrapper">
      <h2 className="ms-heading">Manage Outlets</h2>

      {/* Top buttons */}
      <div className="ms-buttons">
        <button className="ms-btn" onClick={() => navigate("/add-refund")}>
          Add Refund
        </button>
        <button className="ms-btn" onClick={() => navigate("/view-sales")}>
          View Sales
        </button>
        <button className="ms-btn" onClick={() => navigate("/add-stall")}>
          Add Stall
        </button>
        <button className="ms-btn" onClick={() => navigate("/wallet-add-mng")}>
          Add Wallet
        </button>
        <button className="ms-btn" onClick={() => navigate("/manager-view-vendors")}>
          Add Vendor
        </button>
        <button className="ms-btn" onClick={() => navigate("/place-bulk-order")}>
          Place Bulk Order
        </button>
      </div>

      {/* Stall grid */}
      <div className="ms-grid">
        {stallData.map((stall) => (
          <div key={stall.id} className="ms-card">
            {/* ✅ Click image to go to manager items */}
            <img
              src={stall.image_url}
              alt={stall.name}
              className="ms-image"
              onClick={() => navigate(`/manager-items/${stall.id}`)}
              style={{ cursor: "pointer" }}
            />
            <p className="ms-title">{stall.name}</p>
            <button
              className="ms-btn"
              onClick={() => handleEditClick(stall)}
              style={{ marginTop: "10px" }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingStall && (
        <div className="ms-edit-modal">
          <div className="ms-edit-container">
            <h3>Edit Stall</h3>
            <form onSubmit={handleUpdate}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />

              <label>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />

              <label>Opening Time (e.g. 09:00 AM):</label>
              <input
                type="text"
                name="opening_time"
                value={formData.opening_time}
                onChange={handleInputChange}
                placeholder="09:00 AM"
              />

              <label>Closing Time (e.g. 10:00 PM):</label>
              <input
                type="text"
                name="closing_time"
                value={formData.closing_time}
                onChange={handleInputChange}
                placeholder="10:00 PM"
              />

              <label>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                />
                Available
              </label>

              <label>Image:</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />

              <div className="ms-edit-actions">
                <button type="submit" className="ms-btn">
                  Update
                </button>
                <button
                  type="button"
                  className="ms-btn cancel"
                  onClick={() => setEditingStall(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
