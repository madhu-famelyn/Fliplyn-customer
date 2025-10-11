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
    payment_type: "PREPAID",
    image: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

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
    name: stall.name || "",
    description: stall.description || "",
    opening_time: stall.opening_time
      ? stall.opening_time.slice(0, 5) // Keep "HH:MM"
      : "",
    closing_time: stall.closing_time
      ? stall.closing_time.slice(0, 5) // Keep "HH:MM"
      : "",
    is_available: stall.is_available ?? true,
    payment_type: stall.payment_type || "PREPAID",
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

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const form = new FormData();

  // Convert opening and closing times to AM/PM before sending
  const updatedForm = {
    ...formData,
    opening_time: convertTo12Hour(formData.opening_time),
    closing_time: convertTo12Hour(formData.closing_time),
  };

  Object.entries(updatedForm).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      if (key === "image" && value) {
        form.append("file", value);
      } else {
        form.append(key, value);
      }
    }
  });

  if (user?.building_id) form.append("building_id", user.building_id);

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

        <button className="ms-btn" onClick={() => navigate("/add-item-manager")}>
          Add item        
        </button>

      </div>

      {/* Stall grid */}
      <div className="ms-grid">
        {stallData.map((stall) => (
          <div key={stall.id} className="ms-card">
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

              <label>Payment Type:</label>
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
              >
                <option value="PREPAID">PREPAID</option>
                <option value="POSTPAID">POSTPAID</option>
              </select>

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
