import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import "./ManagerStalls.css";

/* ── icon map for action buttons ── */
const ACTION_BUTTONS = [
  { label: "Add Refund",         route: "/add-refund",           icon: "↩" },
  { label: "View Sales",         route: "/view-sales",           icon: "📊" },
  { label: "Add Stall",          route: "/add-stall",            icon: "＋" },
  { label: "Add Wallet",         route: "/wallet-add-mng",       icon: "💳" },
  { label: "Add Vendor",         route: "/manager-view-vendors", icon: "🤝" },
  { label: "Add Item",           route: "/add-item-manager",     icon: "🍽" },
  { label: "Add Category",       route: "/add-category",         icon: "🏷" },
  { label: "Sales Summary",      route: "/sales-summary-om",     icon: "📈" },
  { label: "B2C Transactions",   route: "/b2c-transactions",     icon: "🛒" },
];

/* ── Skeleton placeholder cards while loading ── */
function SkeletonGrid() {
  return (
    <div className="mgr-skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="mgr-skeleton-card" key={i}>
          <div className="mgr-skeleton-img" />
          <div className="mgr-skeleton-footer">
            <div className="mgr-skeleton-text" />
            <div className="mgr-skeleton-icon" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManagerEditStall() {
  const { user } = useAuth();
  const [stallData, setStallData]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [editingStall, setEditingStall] = useState(null);
  const [formData, setFormData]     = useState({
    name:         "",
    description:  "",
    opening_time: "",
    closing_time: "",
    is_available: true,
    payment_type: "PREPAID",
    image:        null,
  });

  const navigate = useNavigate();

  /* ── Fetch stalls ── */
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
        const stalls = res.data || [];
        setStallData(stalls);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch outlets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, [user]);

  /* ── Open edit modal ── */
  const handleEditClick = (stall) => {
    setEditingStall(stall.id);
    setFormData({
      name:         stall.name         || "",
      description:  stall.description  || "",
      opening_time: stall.opening_time || "",
      closing_time: stall.closing_time || "",
      is_available: stall.is_available ?? true,
      payment_type: stall.payment_type || "PREPAID",
      image:        null,
    });
  };

  /* ── Input change handler ── */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ── Image change ── */
  const handleImageChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  /* ── Submit update ── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStall) return;

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
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

  /* ── Close modal on overlay click ── */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setEditingStall(null);
  };

  /* ────────────────────────────────────── */
  /* RENDER                                 */
  /* ────────────────────────────────────── */
  return (
    <div className="mgr-wrapper">

      {/* ── Hero Header ── */}
      <div className="mgr-hero">
        <div className="mgr-hero-inner">

          {/* Left: title */}
          <div className="mgr-hero-left">
            <div className="mgr-breadcrumb">
              Dashboard &rsaquo; <span>Manage Outlets</span>
            </div>
            <h1 className="mgr-heading">Manage Outlets</h1>
            <p className="mgr-subheading">
              View, edit and manage all your food outlets in one place.
            </p>
          </div>

          {/* Right: quick stats */}
          <div className="mgr-stats">
            <div className="mgr-stat-pill">
              <span className="stat-dot" />
              <span className="stat-num">{loading ? "—" : stallData.length}</span>
              Total Outlets
            </div>
            <div className="mgr-stat-pill">
              <span className="stat-dot" />
              <span className="stat-num">
                {loading
                  ? "—"
                  : stallData.filter((s) => s.is_available).length}
              </span>
              Active
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mgr-content">

        {/* Action Buttons */}
        <div className="mgr-actions-section">
          <div className="mgr-actions-label">Quick Actions</div>
          <div className="mgr-btn-row">
            {ACTION_BUTTONS.map(({ label, route, icon }) => (
              <button
                key={label}
                className="mgr-btn"
                onClick={() => navigate(route)}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Outlets Section */}
        <div className="mgr-section-header">
          <div className="mgr-section-title">All Outlets</div>
          {!loading && !error && (
            <div className="mgr-outlet-count">
              {stallData.length} outlet{stallData.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Loading — skeleton */}
        {loading && <SkeletonGrid />}

        {/* Error */}
        {!loading && error && (
          <div className="mgr-error">
            <div className="mgr-error-icon">⚠️</div>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && stallData.length === 0 && (
          <div className="mgr-empty">
            <div className="mgr-empty-icon">🏪</div>
            <div className="mgr-empty-title">No outlets found</div>
            <div className="mgr-empty-sub">
              Click "Add Stall" above to create your first outlet.
            </div>
          </div>
        )}

        {/* Stall Grid */}
        {!loading && !error && stallData.length > 0 && (
          <div className="mgr-grid">
            {stallData.map((stall) => (
              <div key={stall.id} className="mgr-card">

                {/* Image */}
                <div
                  className="mgr-img-wrapper"
                  onClick={() => navigate(`/manager-items/${stall.id}`)}
                >
                  <img
                    src={stall.image_url}
                    alt={stall.name}
                    className="mgr-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  {/* Availability Badge */}
                  <span
                    className={`mgr-status-badge ${
                      stall.is_available ? "mgr-status-active" : "mgr-status-closed"
                    }`}
                  >
                    <span className="mgr-status-dot" />
                    {stall.is_available ? "Active" : "Closed"}
                  </span>
                  <div className="mgr-img-overlay">
                    <span className="mgr-img-overlay-text">View Items</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mgr-card-footer">
                  <div className="mgr-card-info">
                    <p className="mgr-title" title={stall.name}>{stall.name}</p>
                    <div className="mgr-card-items-stat">
                      <span className={`mgr-status-text ${stall.is_available ? 'mgr-stat-active-items' : 'mgr-stat-inactive-items'}`}>
                        {stall.is_available ? "Open" : "Closed"}
                      </span>
                      {stall.payment_type && (
                        <><span className="mgr-stat-divider">•</span>
                        <span className="mgr-stat-active-items">{stall.payment_type}</span></>
                      )}
                    </div>
                  </div>
                  <div
                    className="mgr-edit-btn"
                    title="Edit Outlet"
                    onClick={() => handleEditClick(stall)}
                  >
                    <FaEdit className="mgr-edit-icon" />
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingStall && (
        <div className="mgr-modal" onClick={handleOverlayClick}>
          <div className="mgr-modal-box">

            {/* Modal Header */}
            <div className="mgr-modal-header">
              <h3>Edit Outlet</h3>
              <button
                className="mgr-modal-close"
                onClick={() => setEditingStall(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <div className="mgr-modal-body">
              <form onSubmit={handleUpdate}>

                {/* Name */}
                <div className="mgr-form-group">
                  <label>Outlet Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Annam Parabrahma"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mgr-form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Short description of this outlet…"
                  />
                </div>

                {/* Times */}
                <div className="mgr-time-row">
                  <div className="mgr-form-group">
                    <label>Opening Time</label>
                    <input
                      type="text"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={handleInputChange}
                      placeholder="09:00 AM"
                    />
                  </div>
                  <div className="mgr-form-group">
                    <label>Closing Time</label>
                    <input
                      type="text"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={handleInputChange}
                      placeholder="10:00 PM"
                    />
                  </div>
                </div>

                {/* Payment Type */}
                <div className="mgr-form-group">
                  <label>Payment Type</label>
                  <select
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleInputChange}
                  >
                    <option value="PREPAID">PREPAID</option>
                    <option value="POSTPAID">POSTPAID</option>
                  </select>
                </div>

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
                    <span className="slider" />
                  </label>
                  <span className="toggle-label">
                    {formData.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Image Upload */}
                <div className="mgr-form-group">
                  <label>Outlet Image</label>
                  <div className="mgr-file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="mgr-file-upload-text">
                      {formData.image
                        ? <span>{formData.image.name}</span>
                        : <><span>Choose file</span> or drag & drop here</>
                      }
                    </div>
                  </div>
                </div>

                {/* Footer Buttons (inside form for submit) */}
                <div className="mgr-modal-footer" style={{ padding: "16px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="mgr-btn-modal-cancel"
                    onClick={() => setEditingStall(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="mgr-btn-modal-update">
                    Save Changes
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
