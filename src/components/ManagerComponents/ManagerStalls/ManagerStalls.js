import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
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

  // ✅ Fetch stalls
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
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
        );
        setStallData(res.data);
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

  // ✅ Open edit modal
  const handleEditClick = (stall) => {
    setEditingStall(stall.id);
    setFormData({
      name: stall.name || "",
      description: stall.description || "",
      opening_time: stall.opening_time || "", // Keep full AM/PM
      closing_time: stall.closing_time || "",
      is_available: stall.is_available ?? true,
      payment_type: stall.payment_type || "PREPAID",
      image: null,
    });
  };

  // ✅ Input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Image change
  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  // ✅ Convert 12-hour time string to 24-hour for backend (if needed)
  // const convertTo24Hour = (time12) => {
  //   if (!time12) return "";
  //   const [time, period] = time12.split(" ");
  //   if (!time || !period) return time12;
  //   let [hours, minutes] = time.split(":").map(Number);
  //   if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
  //   if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  //   return `${hours.toString().padStart(2, "0")}:${minutes
  //     .toString()
  //     .padStart(2, "0")}`;
  // };

  // ✅ Handle form submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStall) return;

    const updatedForm = {
      ...formData,
      opening_time: formData.opening_time, // Keep AM/PM format for backend if it supports
      closing_time: formData.closing_time,
    };

    // Optional: If your backend requires 24-hour, uncomment below
    // updatedForm.opening_time = convertTo24Hour(formData.opening_time);
    // updatedForm.closing_time = convertTo24Hour(formData.closing_time);

    const form = new FormData();
    Object.entries(updatedForm).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        if (key === "image" && value) form.append("file", value);
        else form.append(key, value);
      }
    });

    if (user?.building_id) form.append("building_id", user.building_id);

    try {
      await axios.put(
        `https://admin-aged-field-2794.fly.dev/stalls/${editingStall}/edit-basic`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("✅ Stall updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error updating stall:", err.response?.data || err.message);
      alert("❌ Failed to update stall.");
    }
  };

  if (loading) return <p>Loading stalls...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="mgr-wrapper">
      <h2 className="mgr-heading">Manage Outlets</h2>

      {/* Navigation Buttons */}
      <div className="mgr-btn-row">
        <button className="mgr-btn" onClick={() => navigate("/add-refund")}>
          Add Refund
        </button>
        <button className="mgr-btn" onClick={() => navigate("/view-sales")}>
          View Sales
        </button>
        <button className="mgr-btn" onClick={() => navigate("/add-stall")}>
          Add Stall
        </button>
        <button className="mgr-btn" onClick={() => navigate("/wallet-add-mng")}>
          Add Wallet
        </button>
        <button
          className="mgr-btn"
          onClick={() => navigate("/manager-view-vendors")}
        >
          Add Vendor
        </button>
        <button className="mgr-btn" onClick={() => navigate("/add-item-manager")}>
          Add Item
        </button>
        <button className="mgr-btn" onClick={() => navigate("/add-category")}>
          Add Category
        </button>
      </div>

      {/* Stall Grid */}
      <div className="mgr-grid">
        {stallData.map((stall) => (
          <div key={stall.id} className="mgr-card">
            <div
              className="mgr-img-wrapper"
              onClick={() => navigate(`/manager-items/${stall.id}`)}
            >
              <img src={stall.image_url} alt={stall.name} className="mgr-img" />
            </div>
            <div className="mgr-card-footer">
              <p className="mgr-title">{stall.name}</p>
              <FaEdit
                className="mgr-edit-icon"
                title="Edit Stall"
                onClick={() => handleEditClick(stall)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingStall && (
  <div className="mgr-modal">
    <div className="mgr-modal-box">
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

        <label>Opening Time:</label>
        <input
          type="text"
          name="opening_time"
          value={formData.opening_time}
          onChange={handleInputChange}
          placeholder="09:00 AM"
        />

        <label>Closing Time:</label>
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

        {/* Availability Toggle */}
        <div className="toggle-wrapper">
          <label className="switch">
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={() =>
                setFormData({
                  ...formData,
                  is_available: !formData.is_available,
                })
              }
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">Available</span>
        </div>

        <label>Image:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        <div className="mgr-actions">
          <button type="submit" className="mgr-btn">
            Update
          </button>
          <button
            type="button"
            className="mgr-btn cancel"
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
