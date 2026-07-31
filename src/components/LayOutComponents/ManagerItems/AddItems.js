import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import "./AddItems.css";

const API_BASE_URL = 'http://localhost:8000';

export default function AddItemManager() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [manager, setManager] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    gst_percentage: "",
    tax_included: false,
    is_available: true,
    is_veg: false,
    file: null,
  });

  // Fetch manager and stalls
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const managerRes = await axios.get(
          `${API_BASE_URL}/managers/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setManager(managerRes.data);

        const buildingId = managerRes.data.building_id;
        const stallRes = await axios.get(
          `${API_BASE_URL}/stalls/building/${buildingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStalls(stallRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching manager/stalls:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  // Fetch categories for selected stall
  const fetchCategories = async (stallId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/categories/stall/${stallId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      setCategories([]);
    }
  };

  const handleStallChange = (e) => {
    const stallId = e.target.value;
    setSelectedStallId(stallId);
    setSelectedCategoryId("");
    if (stallId) fetchCategories(stallId);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "tax_included") {
      setFormData((prev) => ({
        ...prev,
        tax_included: checked,
        gst_percentage: checked ? "" : prev.gst_percentage, // clear GST if tax included
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manager || !selectedStallId || !selectedCategoryId) {
      alert("Please select stall and category first.");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("price", formData.price);
    if (!formData.tax_included) {
      payload.append("Gst_precentage", formData.gst_percentage || 0);
    }
    payload.append("tax_included", formData.tax_included);
    payload.append("is_available", formData.is_available);
    payload.append("is_veg", formData.is_veg);
    payload.append("building_id", manager.building_id);
    payload.append("stall_id", selectedStallId);
    payload.append("category_id", selectedCategoryId);
    if (manager?.admin_id) payload.append("admin_id", manager.admin_id);
    if (manager?.id) payload.append("manager_id", manager.id);
    if (formData.file) payload.append("file", formData.file);

    try {
      await axios.post(`${API_BASE_URL}/items/`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Item created successfully!");
      setTimeout(() => navigate("/manager-stalls"), 1000);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
      console.error("❌ Error creating item:", errorDetail);
      alert(`Failed to create item: ${typeof errorDetail === "string" ? errorDetail : "Server Error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading manager details...</p>;

  return (
    <div className="add-item-manager-container">
      <h2>Add New Item for Manager</h2>

      <form className="add-item-form" onSubmit={handleSubmit}>
        {/* Stall Selection */}
        <label>Select Stall:</label>
        <select value={selectedStallId} onChange={handleStallChange} required>
          <option value="">-- Select Stall --</option>
          {stalls.map((stall) => (
            <option key={stall.id} value={stall.id}>
              {stall.name}
            </option>
          ))}
        </select>

        {/* Category Selection */}
        <label>Select Category:</label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          required
          disabled={!selectedStallId}
        >
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Item Details */}
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Item Description"
          value={formData.description}
          onChange={handleChange}
        ></textarea>

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="gst_percentage"
          placeholder="GST %"
          value={formData.gst_percentage}
          onChange={handleChange}
          disabled={formData.tax_included}
        />

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              name="tax_included"
              checked={formData.tax_included}
              onChange={handleChange}
            />
            Tax Included
          </label>

          <label>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
            />
            Available
          </label>

          <label>
            <input
              type="checkbox"
              name="is_veg"
              checked={formData.is_veg}
              onChange={handleChange}
            />
            Veg
          </label>
        </div>

        <input type="file" name="file" accept="image/*" onChange={handleChange} />

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Creating Item..." : "Create Item"}
        </button>
      </form>

      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
}
