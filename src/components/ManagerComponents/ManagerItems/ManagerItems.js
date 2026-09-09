import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./ManagerItems.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

export default function ItemListByStall() {
  const navigate = useNavigate();
  const { stallId } = useParams();
  const { user, token } = useAuth();

  // Navigation tab: "ITEMS" vs "COMBOS"
  const [mainTab, setMainTab] = useState("ITEMS");

  // --- Items State ---
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "active" | "inactive"
  const [editingItem, setEditingItem] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    name: "",
    price: "",
    Gst_precentage: "",
    tax_included: false,
    is_available: true,
    is_veg: true,
    file: null,
  });

  // --- Combos State (OM Approvals) ---
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [comboSearch, setComboSearch] = useState("");
  const [comboFilter, setComboFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modern Toast Notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Rejection & Deletion Modals state (replaces prompt/confirm)
  const [rejectModal, setRejectModal] = useState({ isOpen: false, comboId: null, comboName: "", reason: "" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, comboId: null, comboName: "" });

  /* ---------------- FETCH ITEMS ---------------- */
  const fetchItems = useCallback(async () => {
    if (!stallId) {
      setError("Stall ID not found.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/items/stall/${stallId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems(response.data || []);
      setFilteredItems(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch items.");
    } finally {
      setLoading(false);
    }
  }, [stallId, token]);

  /* ---------------- FETCH COMBOS (OM APPROVALS) ---------------- */
  const fetchCombos = useCallback(async () => {
    if (!stallId) return;
    try {
      setLoadingCombos(true);
      const res = await axios.get(`${API_BASE_URL}/combos/stall/${stallId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCombos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching combos for OM:", err);
    } finally {
      setLoadingCombos(false);
    }
  }, [stallId, token]);

  useEffect(() => {
    fetchItems();
    fetchCombos();
  }, [fetchItems, fetchCombos]);

  /* ---------------- FILTER ITEMS ---------------- */
  useEffect(() => {
    let filtered = items.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterTab === "active") filtered = filtered.filter((i) => i.is_available);
    if (filterTab === "inactive") filtered = filtered.filter((i) => !i.is_available);
    setFilteredItems(filtered);
  }, [searchTerm, items, filterTab]);

  /* ---------------- FILTER COMBOS ---------------- */
  const filteredCombos = useMemo(() => {
    return combos
      .filter((c) => c.name?.toLowerCase().includes(comboSearch.toLowerCase()))
      .filter((c) => {
        if (comboFilter === "PENDING") return c.approval_status === "PENDING";
        if (comboFilter === "APPROVED") return c.approval_status === "APPROVED";
        if (comboFilter === "REJECTED") return c.approval_status === "REJECTED";
        return true;
      });
  }, [combos, comboSearch, comboFilter]);

  // Counts for combos
  const pendingCombosCount = combos.filter((c) => c.approval_status === "PENDING").length;
  const approvedCombosCount = combos.filter((c) => c.approval_status === "APPROVED").length;
  const rejectedCombosCount = combos.filter((c) => c.approval_status === "REJECTED").length;

  /* ---------------- ITEM ACTIONS ---------------- */
  const toggleAvailability = async (itemId, currentStatus) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (targetItem?.is_combo && targetItem?.approval_status !== "APPROVED") {
      showToast("⚠️ This combo pack is pending OM approval and cannot be turned ON until approved.", "error");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/items/${itemId}/availability`,
        { is_available: !currentStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      );
      showToast(
        !currentStatus ? "🟢 Item activated in menu." : "⚪ Item deactivated.",
        "info"
      );
    } catch (err) {
      console.error("❌ Error updating availability:", err);
      showToast("Failed to update availability. Please try again.", "error");
      fetchItems();
    }
  };

  const deleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/items/${itemId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("❌ Error deleting item:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setUpdateForm({
      name: item.name || "",
      price: item.price || "",
      Gst_precentage: item.Gst_precentage || "",
      tax_included: item.tax_included || false,
      is_veg: item.is_veg !== undefined ? item.is_veg : true,
      file: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setUpdateForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setUpdateForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setUpdateForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", updateForm.name);
    formData.append("price", updateForm.price);
    formData.append("Gst_precentage", updateForm.Gst_precentage || 0);
    formData.append("tax_included", updateForm.tax_included);
    formData.append("is_veg", updateForm.is_veg);
    if (updateForm.file) {
      formData.append("file", updateForm.file);
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/items/${editingItem.id}/update-image-details`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...response.data } : item
        )
      );
      setEditingItem(null);
      alert("Item updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update item. Please try again.");
    }
  };

  /* ---------------- COMBO OM APPROVAL ACTIONS ---------------- */
  const handleApproveCombo = async (comboId, comboName) => {
    try {
      setActionLoadingId(comboId);
      await axios.patch(
        `${API_BASE_URL}/combos/${comboId}/approve`,
        { action: "APPROVE", manager_id: user?.id },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      // Instant local state update
      setCombos((prev) =>
        prev.map((c) =>
          c.id === comboId
            ? { ...c, approval_status: "APPROVED", is_active: true, rejection_reason: null }
            : c
        )
      );
      showToast(`✅ Combo "${comboName}" approved! It is now active and live in the stall menu.`, "success");
    } catch (err) {
      console.error("Error approving combo:", err);
      showToast("❌ Failed to approve combo pack. Please try again.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (comboId, comboName) => {
    setRejectModal({ isOpen: true, comboId, comboName, reason: "" });
  };

  const handleConfirmReject = async () => {
    const { comboId, comboName, reason } = rejectModal;
    if (!comboId) return;

    try {
      setActionLoadingId(comboId);
      const cleanReason = reason.trim() || "Rejected by Operations Manager";
      await axios.patch(
        `${API_BASE_URL}/combos/${comboId}/reject`,
        { action: "REJECT", reason: cleanReason, manager_id: user?.id },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setCombos((prev) =>
        prev.map((c) =>
          c.id === comboId
            ? { ...c, approval_status: "REJECTED", is_active: false, rejection_reason: cleanReason }
            : c
        )
      );
      setRejectModal({ isOpen: false, comboId: null, comboName: "", reason: "" });
      showToast(`❌ Combo "${comboName}" rejected.`, "info");
    } catch (err) {
      console.error("Error rejecting combo:", err);
      showToast("❌ Failed to reject combo pack. Please try again.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleComboActive = async (comboId, currentActive, approvalStatus) => {
    if (approvalStatus !== "APPROVED") {
      showToast("⚠️ Combos pending OM approval cannot be turned ON until approved.", "error");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}/combos/${comboId}/toggle-status`,
        { is_active: !currentActive },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setCombos((prev) =>
        prev.map((c) => (c.id === comboId ? { ...c, is_active: !currentActive } : c))
      );
      showToast(
        !currentActive ? "🟢 Combo activated in stall menu." : "⚪ Combo hidden from stall menu.",
        "info"
      );
    } catch (err) {
      console.error("Error toggling combo status:", err);
      showToast("Failed to toggle status.", "error");
      fetchCombos();
    }
  };

  const openDeleteModal = (comboId, comboName) => {
    setDeleteModal({ isOpen: true, comboId, comboName });
  };

  const handleConfirmDelete = async () => {
    const { comboId, comboName } = deleteModal;
    if (!comboId) return;

    try {
      await axios.delete(`${API_BASE_URL}/combos/${comboId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCombos((prev) => prev.filter((c) => c.id !== comboId));
      setDeleteModal({ isOpen: false, comboId: null, comboName: "" });
      showToast(`🗑️ Combo "${comboName}" deleted.`, "info");
    } catch (err) {
      console.error("Error deleting combo:", err);
      showToast("Failed to delete combo pack.", "error");
    }
  };

  if (loading && items.length === 0) return <p className="ils-loading-text">Loading stall items...</p>;
  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;

  return (
    <div className="ils-wrapper">
      {/* Top Header Navigation Bar with Back Button */}
      <div className="ils-top-nav-bar">
        <button
          className="ils-back-btn"
          onClick={() => navigate("/manager-stalls")}
          title="Return to Outlets dashboard"
        >
          ← Back to Outlets
        </button>

        <div className="ils-main-tabs">
          <button
            className={`ils-tab-btn ${mainTab === "ITEMS" ? "active" : ""}`}
            onClick={() => setMainTab("ITEMS")}
          >
            📋 Menu Items ({items.length})
          </button>
          <button
            className={`ils-tab-btn ${mainTab === "COMBOS" ? "active" : ""}`}
            onClick={() => setMainTab("COMBOS")}
          >
            🍱 Combo Approvals ({combos.length})
            {pendingCombosCount > 0 && (
              <span className="ils-tab-pending-badge">{pendingCombosCount} Pending</span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: REGULAR MENU ITEMS                                  */}
      {/* ============================================================ */}
      {mainTab === "ITEMS" ? (
        <>
          <div className="ils-header-section">
            <h2 className="ils-heading">Items for Stall</h2>
            <div className="ils-stats">
              <div
                className={`ils-stat-pill${filterTab === "all" ? " selected" : ""}`}
                onClick={() => setFilterTab("all")}
                style={{ cursor: "pointer" }}
              >
                <span className="stat-dot" />
                <span className="stat-num">{items.length}</span>
                Total Items
              </div>
              <div
                className={`ils-stat-pill active${filterTab === "active" ? " selected" : ""}`}
                onClick={() => setFilterTab("active")}
                style={{ cursor: "pointer" }}
              >
                <span className="stat-dot active" />
                <span className="stat-num">
                  {items.filter((item) => item.is_available).length}
                </span>
                Active
              </div>
              <div
                className={`ils-stat-pill inactive${filterTab === "inactive" ? " selected" : ""}`}
                onClick={() => setFilterTab("inactive")}
                style={{ cursor: "pointer" }}
              >
                <span className="stat-dot inactive" />
                <span className="stat-num">
                  {items.filter((item) => !item.is_available).length}
                </span>
                Inactive
              </div>
            </div>
          </div>

          <input
            type="text"
            className="ils-search"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="ils-row">
            {filteredItems.map((item) => {
              const gstAmount = item.Gst_precentage
                ? (item.price * item.Gst_precentage) / 100
                : 0;

              return (
                <div className="ils-card" key={item.id}>
                  <img
                    src={item.image_url || "/fallback.png"}
                    alt={item.name}
                    className="ils-image"
                  />
                  <div className="ils-info">
                    <h3 className="ils-name">
                      {item.name}
                      {item.is_combo && item.approval_status === "PENDING" && (
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#fef3c7", color: "#b45309", padding: "2px 7px", borderRadius: "5px", marginLeft: "8px", border: "1px solid #fde68a" }}>
                          ⏳ Pending OM Approval
                        </span>
                      )}
                      {item.is_combo && item.approval_status === "REJECTED" && (
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#fee2e2", color: "#b91c1c", padding: "2px 7px", borderRadius: "5px", marginLeft: "8px", border: "1px solid #fca5a5" }}>
                          ❌ Rejected
                        </span>
                      )}
                    </h3>
                    <p className="ils-price">₹{item.price.toFixed(2)}</p>
                    <p className="ils-gst">incl. {gstAmount.toFixed(2)} GST</p>
                  </div>
                  <div className="ils-actions">
                    <label
                      className="switch"
                      style={item.is_combo && item.approval_status !== "APPROVED" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                      title={item.is_combo && item.approval_status !== "APPROVED" ? "Locked: Awaiting OM approval" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={item.is_available}
                        disabled={item.is_combo && item.approval_status !== "APPROVED"}
                        onChange={() =>
                          toggleAvailability(item.id, item.is_available)
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                    <button
                      className="ils-edit-btn"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="ils-delete-btn"
                      onClick={() => deleteItem(item.id, item.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ============================================================ */
        /* VIEW 2: COMBO PACK APPROVALS (OM VIEW)                       */
        /* ============================================================ */
        <div className="ils-combos-approval-view">
          <div className="ils-header-section">
            <div>
              <h2 className="ils-heading">Combo Pack Approvals</h2>
              <p className="ils-subheading">Review, approve, or reject vendor-generated combo packs for this stall.</p>
            </div>

            <div className="ils-stats">
              <div
                className={`ils-stat-pill${comboFilter === "ALL" ? " selected" : ""}`}
                onClick={() => setComboFilter("ALL")}
              >
                <span className="stat-dot" />
                <span className="stat-num">{combos.length}</span>
                All
              </div>
              <div
                className={`ils-stat-pill pending-stat${comboFilter === "PENDING" ? " selected" : ""}`}
                onClick={() => setComboFilter("PENDING")}
              >
                <span className="stat-dot pending-dot" />
                <span className="stat-num">{pendingCombosCount}</span>
                Pending
              </div>
              <div
                className={`ils-stat-pill active${comboFilter === "APPROVED" ? " selected" : ""}`}
                onClick={() => setComboFilter("APPROVED")}
              >
                <span className="stat-dot active" />
                <span className="stat-num">{approvedCombosCount}</span>
                Approved
              </div>
              <div
                className={`ils-stat-pill inactive${comboFilter === "REJECTED" ? " selected" : ""}`}
                onClick={() => setComboFilter("REJECTED")}
              >
                <span className="stat-dot inactive" />
                <span className="stat-num">{rejectedCombosCount}</span>
                Rejected
              </div>
            </div>
          </div>

          <input
            type="text"
            className="ils-search"
            placeholder="Search combo packs..."
            value={comboSearch}
            onChange={(e) => setComboSearch(e.target.value)}
          />

          {loadingCombos ? (
            <p className="ils-loading-text">Loading combo packs...</p>
          ) : filteredCombos.length === 0 ? (
            <div className="ils-empty-combos">
              <span style={{ fontSize: "36px" }}>🍱</span>
              <h3>No Combo Packs Found</h3>
              <p>No combo packs match the selected filter for this stall.</p>
            </div>
          ) : (
            <div className="ils-combos-grid">
              {filteredCombos.map((combo) => (
                <div
                  key={combo.id}
                  className={`ils-combo-card ${combo.approval_status.toLowerCase()}`}
                >
                  {combo.image_url && (
                    <div className="ils-combo-card-image-wrapper">
                      <img src={combo.image_url} alt={combo.name} className="ils-combo-card-img" />
                    </div>
                  )}

                  {/* Status Banner */}
                  <div className="ils-combo-card-top-row">
                    {combo.approval_status === "PENDING" && (
                      <span className="ils-combo-badge pending">⏳ Pending OM Approval</span>
                    )}
                    {combo.approval_status === "APPROVED" && (
                      <span className="ils-combo-badge approved">✅ Approved</span>
                    )}
                    {combo.approval_status === "REJECTED" && (
                      <span className="ils-combo-badge rejected" title={combo.rejection_reason}>
                        ❌ Rejected ({combo.rejection_reason || "Check with OM"})
                      </span>
                    )}

                    {/* Active toggle for approved combos */}
                    {combo.approval_status === "APPROVED" && (
                      <label className="switch" title={combo.is_active ? "Live in stall (ON)" : "Hidden from stall (OFF)"}>
                        <input
                          type="checkbox"
                          checked={combo.is_active}
                          onChange={() =>
                            handleToggleComboActive(combo.id, combo.is_active, combo.approval_status)
                          }
                        />
                        <span className="slider round"></span>
                      </label>
                    )}
                  </div>

                  {/* Combo Name & Description */}
                  <div className="ils-combo-title-box">
                    <span className={`ils-combo-veg-dot ${combo.is_veg ? "veg" : "non-veg"}`}>●</span>
                    <div>
                      <h3 className="ils-combo-name">{combo.name}</h3>
                      {combo.description && (
                        <p className="ils-combo-desc">{combo.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Included Items Breakdown */}
                  <div className="ils-combo-components-box">
                    <span className="ils-combo-comp-label">Includes ({combo.items_json?.length || 0} items):</span>
                    <div className="ils-combo-chips">
                      {combo.items_json?.map((it, idx) => (
                        <span key={idx} className="ils-combo-chip">
                          <strong>{it.quantity}×</strong> {it.name} <small>(₹{it.price})</small>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Row */}
                  <div className="ils-combo-pricing-row">
                    <div>
                      <span className="ils-combo-selling-price">₹{combo.combo_price}</span>
                      <span className="ils-combo-reg-price">₹{combo.regular_price}</span>
                    </div>
                    <span className="ils-combo-save-badge">
                      Save ₹{combo.discount_amount} ({Math.round(combo.discount_percentage)}% OFF)
                    </span>
                  </div>

                  {/* OM Approval Action Buttons */}
                  <div className="ils-combo-om-actions">
                    {combo.approval_status === "PENDING" && (
                      <>
                        <button
                          className="ils-om-approve-btn"
                          disabled={actionLoadingId === combo.id}
                          onClick={() => handleApproveCombo(combo.id, combo.name)}
                        >
                          {actionLoadingId === combo.id ? "Approving..." : "✅ Approve Combo"}
                        </button>
                        <button
                          className="ils-om-reject-btn"
                          disabled={actionLoadingId === combo.id}
                          onClick={() => openRejectModal(combo.id, combo.name)}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}

                    {combo.approval_status === "REJECTED" && (
                      <button
                        className="ils-om-approve-btn"
                        disabled={actionLoadingId === combo.id}
                        onClick={() => handleApproveCombo(combo.id, combo.name)}
                      >
                        {actionLoadingId === combo.id ? "Approving..." : "✅ Re-Approve Combo"}
                      </button>
                    )}

                    {combo.approval_status === "APPROVED" && (
                      <button
                        className="ils-om-reject-btn"
                        disabled={actionLoadingId === combo.id}
                        onClick={() => openRejectModal(combo.id, combo.name)}
                      >
                        ❌ Revoke / Reject
                      </button>
                    )}

                    <button
                      className="ils-delete-btn"
                      onClick={() => openDeleteModal(combo.id, combo.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Edit Modal */}
      {editingItem && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>Update Item</h3>
            <form onSubmit={handleUpdateSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Item name"
                value={updateForm.name}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={updateForm.price}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="Gst_precentage"
                placeholder="GST %"
                value={updateForm.Gst_precentage}
                onChange={handleChange}
              />

              <label>
                <input
                  type="checkbox"
                  name="tax_included"
                  checked={updateForm.tax_included}
                  onChange={handleChange}
                />
                Tax Included
              </label>

              <label>
                <input
                  type="checkbox"
                  name="is_veg"
                  checked={updateForm.is_veg}
                  onChange={handleChange}
                />
                Vegetarian
              </label>

              <label>
                Upload New Image:
                <input type="file" name="file" onChange={handleChange} />
              </label>

              <div className="ils-modal-buttons">
                <button type="submit" className="ils-save-btn">
                  Update
                </button>
                <button
                  type="button"
                  className="ils-cancel-btn"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            backgroundColor: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#0f172a" : "#16a34a",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            fontSize: "14.5px",
            fontWeight: "600",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "fadeIn 0.25s ease-in-out",
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "16px",
              cursor: "pointer",
              padding: "0 0 0 8px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ✅ Reject Combo Modal */}
      {rejectModal.isOpen && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>❌ Reject Combo Pack</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "-10px 0 15px 0" }}>
              Optionally enter feedback or reason for rejecting <strong>"{rejectModal.comboName}"</strong>:
            </p>
            <textarea
              rows="3"
              placeholder="e.g. Discount too high, item not available, etc."
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <div className="ils-modal-buttons">
              <button
                type="button"
                className="ils-cancel-btn"
                onClick={() =>
                  setRejectModal({ isOpen: false, comboId: null, comboName: "", reason: "" })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="ils-save-btn"
                style={{ background: "#dc2626" }}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Combo Modal */}
      {deleteModal.isOpen && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>🗑️ Delete Combo Pack</h3>
            <p style={{ fontSize: "14px", color: "#334155", margin: "10px 0 20px 0" }}>
              Are you sure you want to delete combo pack <strong>"{deleteModal.comboName}"</strong>? This cannot be undone.
            </p>
            <div className="ils-modal-buttons">
              <button
                type="button"
                className="ils-cancel-btn"
                onClick={() => setDeleteModal({ isOpen: false, comboId: null, comboName: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ils-save-btn"
                style={{ background: "#dc2626" }}
                onClick={handleConfirmDelete}
              >
                Delete Combo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
