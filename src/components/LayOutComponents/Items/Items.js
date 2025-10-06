// src/pages/Item.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ItemBulkUpload from "./ItemBulkUpload";
import {
  createItem,
  getItemsByCategoryId,
  updateItemAvailability,
  deleteItemById,
  updateItemImage, // ✅ new import
} from "./Service";
import { useAuth } from "../../AuthContex/AdminContext";
import AdminLayout from "../../LayOut/AdminLayout";
import ItemForm from "./ItemForm";
import ItemList from "./ItemList";
import "./Items.css";

const Item = () => {
  const location = useLocation();
  const { buildingId, stallId, categoryId } = location.state || {};
  const { userId: adminId } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    Gst_precentage: "",
    tax_included: false,
    is_available: true,
    building_id: "",
    stall_id: "",
    category_id: "",
    admin_id: "",
  });

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

useEffect(() => {
  console.log("🛠️ Item page mounted");
  console.log("Location state:", location.state);
  console.log("Context adminId:", adminId);
  console.log("buildingId:", buildingId, "stallId:", stallId, "categoryId:", categoryId);

  if (!buildingId || !stallId || !categoryId || !adminId) {
    console.warn(
      "⚠️ Missing required IDs, cannot fetch items",
      { buildingId, stallId, categoryId, adminId }
    );
    return;
  }

  setFormData((prev) => ({
    ...prev,
    building_id: buildingId,
    stall_id: stallId,
    category_id: categoryId,
    admin_id: adminId,
  }));

  fetchItems(categoryId);
}, [buildingId, stallId, categoryId, adminId, location.state]);


const fetchItems = async (catId) => {
  console.log("🔍 fetchItems called for categoryId:", catId);

  try {
    const data = await getItemsByCategoryId(catId);
    console.log("📦 Items fetched:", data);

    const sorted = Array.isArray(data)
      ? data.sort((a, b) => (b.is_available === true) - (a.is_available === true))
      : [];
    setItems(sorted);
  } catch (err) {
    console.error("❌ Failed to fetch items:", err);
    setItems([]);
  }
};


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "tax_included") {
      const isChecked = checked;
      setFormData((prev) => ({
        ...prev,
        tax_included: isChecked,
        Gst_precentage: isChecked ? "" : prev.Gst_precentage,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formPayload = new FormData();
    for (const key in formData) {
      if (formData[key] !== "") {
        formPayload.append(key, formData[key]);
      }
    }
    if (file) formPayload.append("file", file);

    try {
      await createItem(formPayload);
      setMessage("✅ Item created successfully!");
      setFormData((prev) => ({
        ...prev,
        name: "",
        description: "",
        price: "",
        Gst_precentage: "",
        tax_included: false,
        is_available: true,
      }));
      setFile(null);
      fetchItems(categoryId);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to create item");
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await updateItemAvailability(itemId, !currentStatus);
      fetchItems(categoryId);
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  };

  const handleDelete = async (itemId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDelete) return;

    try {
      await deleteItemById(itemId);
      setMessage("🗑️ Item deleted");
      fetchItems(categoryId);
    } catch (err) {
      console.error("Error deleting item:", err);
      setMessage("❌ Failed to delete item");
    }
  };

  // ✅ New: handle image update
  const handleImageUpdate = async (itemId, file) => {
    try {
      await updateItemImage(itemId, file);
      setMessage("🖼️ Image updated successfully!");
      fetchItems(categoryId);
    } catch (err) {
      console.error("Error updating image:", err);
      setMessage("❌ Failed to update image");
    }
  };

  return (
    <AdminLayout>
      <div className="item-container">
        <h2>Items</h2>

        <div className="item-actions">
          <button
            onClick={() => setShowForm(!showForm)}
            className="add-item-btn"
          >
            {showForm ? "Close Form" : "+ Add Item"}
          </button>

          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="upload-excel-btn"
          >
            {showBulkUpload ? "Close Bulk Upload" : "📄 Upload Excel"}
          </button>
        </div>

        {showForm && (
          <ItemForm
            formData={formData}
            file={file}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setFile={setFile}
            message={message}
          />
        )}

        {showBulkUpload && (
          <ItemBulkUpload
            buildingId={buildingId}
            stallId={stallId}
            categoryId={categoryId}
            adminId={adminId}
            onSuccess={() => fetchItems(categoryId)}
          />
        )}

        <ItemList
          items={items}
          handleToggleAvailability={handleToggleAvailability}
          handleDelete={handleDelete}
          handleImageUpdate={handleImageUpdate} // ✅ pass down
        />
      </div>
    </AdminLayout>
  );
};

export default Item;
