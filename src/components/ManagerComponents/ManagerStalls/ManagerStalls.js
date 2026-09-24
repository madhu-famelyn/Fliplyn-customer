import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import { 
  FaEdit, 
  FaPowerOff, 
  FaBookmark, 
  FaRegBookmark, 
  FaCheck, 
  FaSearch, 
  FaSlidersH, 
  FaBolt, 
  FaCheckSquare, 
  FaSquare,
  FaSpinner 
} from "react-icons/fa";
import "./ManagerStalls.css";

/* ── icon map for action buttons ── */
const ACTION_BUTTONS = [
  { label: "Combo Approvals",    route: "/om-combo-approvals",   icon: "🍱" },
  { label: "Add Refund",         route: "/add-refund",           icon: "↩" },
  { label: "View Sales",         route: "/view-sales",           icon: "📊" },
  { label: "Add Stall",          route: "/add-stall",            icon: "＋" },
  { label: "Add Wallet",         route: "/wallet-add-mng",       icon: "💳" },
  { label: "Add Vendor",         route: "/manager-view-vendors", icon: "🤝" },
  { label: "Add Item",           route: "/add-item-manager",     icon: "🍽" },
  { label: "Add Category",       route: "/add-category",         icon: "🏷" },
  { label: "Sales Summary",      route: "/sales-summary-om",     icon: "📈" },
  { label: "B2C Transactions",   route: "/b2c-transactions",     icon: "🛒" },
  { label: "Menu List",          route: "/om-menu-list",         icon: "📋" },
  { label: "Account",            route: "/management/dashboard", icon: "💼" },
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
  const [pendingCombosCount, setPendingCombosCount] = useState(0);
  const [editingStall, setEditingStall] = useState(null);
  
  /* ── Quick Switch & Saved Stalls State ── */
  const [savedStallIds, setSavedStallIds] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [togglingStallId, setTogglingStallId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

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

  const apiBase = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

  const storageKey = useMemo(() => {
    return `om_saved_stalls_${user?.id || user?.building_id || 'default'}`;
  }, [user]);

  /* ── Toast notification helper ── */
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  /* ── Load Saved Stalls from localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedStallIds(parsed);
        }
      }
    } catch (e) {
      console.error("Error reading saved stalls from localStorage:", e);
    }
  }, [storageKey]);

  /* ── Fetch stalls & pending combos ── */
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
          `${apiBase}/stalls/building/${user.building_id}`
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

    const fetchPendingCombos = async () => {
      if (!user?.building_id) return;
      try {
        const res = await axios.get(`${apiBase}/combos/building/${user.building_id}`);
        const list = Array.isArray(res.data) ? res.data : [];
        const pending = list.filter((c) => c.approval_status === "PENDING").length;
        setPendingCombosCount(pending);
      } catch (err) {
        console.error("Error fetching pending combos count:", err);
      }
    };

    fetchStalls();
    fetchPendingCombos();
  }, [user, apiBase]);

  /* ── Save selection to localStorage ── */
  const persistSavedStalls = (newIds) => {
    setSavedStallIds(newIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newIds));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  /* ── Open Configure Modal ── */
  const handleOpenConfigModal = () => {
    setTempSelectedIds([...savedStallIds]);
    setModalSearchQuery("");
    setIsConfigModalOpen(true);
  };

  /* ── Toggle selection of a stall in the modal ── */
  const handleToggleModalSelection = (stallId) => {
    setTempSelectedIds((prev) =>
      prev.includes(stallId) ? prev.filter((id) => id !== stallId) : [...prev, stallId]
    );
  };

  /* ── Select All / Deselect All in Modal ── */
  const handleSelectAllModal = () => {
    const allFilteredIds = filteredModalStalls.map((s) => s.id);
    const areAllSelected = allFilteredIds.every((id) => tempSelectedIds.includes(id));
    if (areAllSelected) {
      // Deselect all filtered
      setTempSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      const union = Array.from(new Set([...tempSelectedIds, ...allFilteredIds]));
      setTempSelectedIds(union);
    }
  };

  /* ── Save selection from Modal ── */
  const handleSaveModalSelection = () => {
    persistSavedStalls(tempSelectedIds);
    setIsConfigModalOpen(false);
    showToast(`✅ Saved ${tempSelectedIds.length} outlet${tempSelectedIds.length !== 1 ? "s" : ""} for Quick Power Switch!`);
  };

  /* ── Toggle Pin / Bookmark directly from stall card ── */
  const handleTogglePinStall = (stallId, stallName) => {
    const isCurrentlySaved = savedStallIds.includes(stallId);
    let updated;
    if (isCurrentlySaved) {
      updated = savedStallIds.filter((id) => id !== stallId);
      showToast(`Removed "${stallName}" from Saved Group`, "info");
    } else {
      updated = [...savedStallIds, stallId];
      showToast(`Added "${stallName}" to Saved Group`, "success");
    }
    persistSavedStalls(updated);
  };

  /* ── Single Stall ON/OFF Toggle ── */
  const handleToggleSingleStall = async (stall, e) => {
    if (e) e.stopPropagation();
    const nextValue = !stall.is_available;
    setTogglingStallId(stall.id);

    // Optimistic UI update
    setStallData((prev) =>
      prev.map((s) => (s.id === stall.id ? { ...s, is_available: nextValue } : s))
    );

    try {
      await axios.put(`${apiBase}/stalls/${stall.id}/availability`, {
        is_available: nextValue,
      });
      showToast(`"${stall.name}" is now ${nextValue ? "🟢 Active (Open)" : "🔴 Closed"}`);
    } catch (err) {
      console.error("Failed to toggle outlet availability:", err);
      // Revert optimistic update
      setStallData((prev) =>
        prev.map((s) => (s.id === stall.id ? { ...s, is_available: !nextValue } : s))
      );
      showToast(`❌ Failed to update "${stall.name}". Please try again.`, "error");
    } finally {
      setTogglingStallId(null);
    }
  };

  /* ── Bulk Turn ON or OFF Saved Stalls ── */
  const handleBulkToggle = async (targetState) => {
    if (savedStallIds.length === 0) {
      setAlertModal({
        title: "No Outlets Selected",
        message: "You haven't saved any outlets for Quick Switch yet. Click 'Select & Save Outlets' to choose your outlets.",
        type: "warning",
        icon: "⚠️",
      });
      return;
    }

    const savedStalls = stallData.filter((s) => savedStallIds.includes(s.id));
    const stallsNeedingChange = savedStalls.filter((s) => s.is_available !== targetState);

    // 🛑 Check if turning OFF but all stalls are already CLOSED
    if (!targetState && stallsNeedingChange.length === 0) {
      setAlertModal({
        title: "All Outlets Already Closed",
        message: "All the outlets in your saved group are already Turned OFF (Closed). The button did not make any changes.",
        type: "info",
        icon: "🛑",
      });
      showToast("⚠️ All saved outlets are already closed!", "info");
      return;
    }

    // 🛑 Check if turning ON but all stalls are already OPEN
    if (targetState && stallsNeedingChange.length === 0) {
      setAlertModal({
        title: "All Outlets Already Open",
        message: "All the outlets in your saved group are already Turned ON (Active/Open). The button did not make any changes.",
        type: "info",
        icon: "🟢",
      });
      showToast("⚠️ All saved outlets are already open!", "info");
      return;
    }

    const stateLabel = targetState ? "ON (Active/Open)" : "OFF (Closed)";
    const countText = stallsNeedingChange.length === savedStalls.length
      ? `all ${savedStalls.length}`
      : `${stallsNeedingChange.length} of ${savedStalls.length}`;

    const confirmMsg = `Are you sure you want to turn ${stateLabel} ${countText} saved outlet(s)?`;
    if (!window.confirm(confirmMsg)) return;

    const idsToUpdate = stallsNeedingChange.map((s) => s.id);
    setIsBulkUpdating(true);

    // Optimistic UI update
    setStallData((prev) =>
      prev.map((s) =>
        idsToUpdate.includes(s.id) ? { ...s, is_available: targetState } : s
      )
    );

    try {
      // Try batch endpoint first
      let success = false;
      try {
        await axios.put(`${apiBase}/stalls/batch-availability`, {
          stall_ids: idsToUpdate,
          is_available: targetState,
        });
        success = true;
      } catch (batchErr) {
        console.warn("Batch endpoint unavailable, falling back to parallel updates:", batchErr);
      }

      // Fallback to parallel requests if batch endpoint failed
      if (!success) {
        const updatePromises = idsToUpdate.map((id) =>
          axios.put(`${apiBase}/stalls/${id}/availability`, {
            is_available: targetState,
          })
        );
        await Promise.allSettled(updatePromises);
      }

      showToast(`⚡ Successfully turned ${targetState ? "ON" : "OFF"} ${idsToUpdate.length} outlet(s)!`, "success");
    } catch (err) {
      console.error("Error performing bulk toggle:", err);
      showToast("⚠️ Some outlets could not be updated. Refreshing...", "error");
      // Refetch current status from server
      try {
        const res = await axios.get(`${apiBase}/stalls/building/${user.building_id}`);
        setStallData(res.data || []);
      } catch (refetchErr) {
        console.error(refetchErr);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };


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
        `${apiBase}/stalls/${editingStall}/edit-basic`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showToast("✅ Stall updated successfully!");
      setEditingStall(null);
      // Refresh list
      const res = await axios.get(`${apiBase}/stalls/building/${user.building_id}`);
      setStallData(res.data || []);
    } catch (err) {
      console.error("Error updating stall:", err.response?.data || err.message);
      showToast("❌ Failed to update stall.", "error");
    }
  };

  /* ── Close modal on overlay click ── */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setEditingStall(null);
  };

  /* ── Filtered stalls for configure modal ── */
  const filteredModalStalls = useMemo(() => {
    if (!modalSearchQuery.trim()) return stallData;
    const q = modalSearchQuery.toLowerCase();
    return stallData.filter((s) => s.name?.toLowerCase().includes(q));
  }, [stallData, modalSearchQuery]);

  /* ── Stats for saved stalls ── */
  const savedStallsObjects = useMemo(() => {
    return stallData.filter((s) => savedStallIds.includes(s.id));
  }, [stallData, savedStallIds]);

  const savedActiveCount = useMemo(() => {
    return savedStallsObjects.filter((s) => s.is_available).length;
  }, [savedStallsObjects]);

  const savedClosedCount = useMemo(() => {
    return savedStallsObjects.filter((s) => !s.is_available).length;
  }, [savedStallsObjects]);

  /* ────────────────────────────────────── */
  /* RENDER                                 */
  /* ────────────────────────────────────── */
  return (
    <div className="mgr-wrapper">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`mgr-toast mgr-toast-${toastMessage.type}`}>
          <span>{toastMessage.message}</span>
          <button className="mgr-toast-close" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

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
              View, edit and control all your food outlets with quick power switches.
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
            <div
              className="mgr-stat-pill"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/om-combo-approvals")}
              title="Click to view combo approvals"
            >
              <span
                className="stat-dot"
                style={{
                  background: pendingCombosCount > 0 ? "#f59e0b" : "#22c55e",
                  boxShadow: pendingCombosCount > 0 ? "0 0 6px #f59e0b" : "0 0 6px #22c55e",
                }}
              />
              <span
                className="stat-num"
                style={{ color: pendingCombosCount > 0 ? "#f59e0b" : undefined }}
              >
                {loading ? "—" : pendingCombosCount}
              </span>
              Pending Combos
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mgr-content">

        {/* Pending Combos Alert Banner */}
        {pendingCombosCount > 0 && (
          <div
            className="mgr-pending-combos-alert"
            onClick={() => navigate("/om-combo-approvals")}
            style={{
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              border: "1.5px solid #fde68a",
              borderRadius: "14px",
              padding: "14px 20px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.12)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "28px" }}>⚡</span>
              <div>
                <strong style={{ display: "block", color: "#92400e", fontSize: "15px" }}>
                  {pendingCombosCount} Combo Pack{pendingCombosCount > 1 ? "s" : ""} Awaiting OM Approval
                </strong>
                <span style={{ color: "#b45309", fontSize: "13px" }}>
                  Vendors have submitted combo packs for your building. Approve them to make them live.
                </span>
              </div>
            </div>
            <button
              style={{
                background: "#ea580c",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "13.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Review & Approve →
            </button>
          </div>
        )}

        {/* ── ⚡ SAVED STALLS POWER SWITCH PANEL (User Request) ── */}
        {!loading && !error && stallData.length > 0 && (
          <div className="mgr-quick-switch-card">
            <div className="mgr-quick-switch-header">
              <div className="mgr-quick-switch-title-wrap">
                <div className="mgr-quick-switch-icon-box">
                  <FaBolt />
                </div>
                <div>
                  <h3 className="mgr-quick-switch-title">Saved Outlets Power Switch</h3>
                  <p className="mgr-quick-switch-subtitle">
                    Select & save a custom group of outlets to turn them all <strong>ON</strong> or <strong>OFF</strong> simultaneously in one click.
                  </p>
                </div>
              </div>

              {/* Status Chips */}
              <div className="mgr-quick-switch-stats">
                <span className="mgr-qs-stat-chip">
                  <strong>{savedStallIds.length}</strong> of {stallData.length} Selected
                </span>
                <span className="mgr-qs-stat-chip mgr-qs-chip-active">
                  <span className="stat-dot" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                  <strong>{savedActiveCount}</strong> ON
                </span>
                <span className="mgr-qs-stat-chip mgr-qs-chip-inactive">
                  <span className="stat-dot" style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                  <strong>{savedClosedCount}</strong> OFF
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="mgr-quick-switch-actions">
              <div className="mgr-quick-switch-buttons">
                {/* Turn ON All Saved */}
                <button
                  type="button"
                  className="mgr-qs-btn mgr-qs-btn-on"
                  disabled={isBulkUpdating || savedStallIds.length === 0}
                  onClick={() => handleBulkToggle(true)}
                  title="Turn ON (Open) all selected saved outlets"
                >
                  {isBulkUpdating ? (
                    <FaSpinner className="mgr-spin-icon" />
                  ) : (
                    <span className="mgr-qs-dot-on" />
                  )}
                  <span>Turn <strong>ON</strong> Saved ({savedStallIds.length})</span>
                </button>

                {/* Turn OFF All Saved */}
                <button
                  type="button"
                  className="mgr-qs-btn mgr-qs-btn-off"
                  disabled={isBulkUpdating || savedStallIds.length === 0}
                  onClick={() => handleBulkToggle(false)}
                  title="Turn OFF (Close) all selected saved outlets"
                >
                  {isBulkUpdating ? (
                    <FaSpinner className="mgr-spin-icon" />
                  ) : (
                    <span className="mgr-qs-dot-off" />
                  )}
                  <span>Turn <strong>OFF</strong> Saved ({savedStallIds.length})</span>
                </button>

                {/* Configure / Select Saved Stalls */}
                <button
                  type="button"
                  className="mgr-qs-btn mgr-qs-btn-config"
                  onClick={handleOpenConfigModal}
                >
                  <FaSlidersH />
                  <span>Select & Save Outlets ({savedStallIds.length})</span>
                </button>
              </div>

              {savedStallIds.length === 0 ? (
                <div className="mgr-qs-empty-tip">
                  👉 No outlets selected yet! Click <strong>"Select & Save Outlets"</strong> to choose which stalls will be turned ON/OFF together.
                </div>
              ) : (
                <div className="mgr-qs-active-summary">
                  Saved group contains: <strong>{savedStallsObjects.map(s => s.name).join(", ") || `${savedStallIds.length} outlets`}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mgr-actions-section">
          <div className="mgr-actions-label">Quick Actions</div>
          <div className="mgr-btn-row">
            {/* Quick Switch Shortcut */}
            <button
              className="mgr-btn mgr-btn-highlight"
              onClick={handleOpenConfigModal}
              title="Configure Saved Outlets Power Switch"
            >
              <span>⚡</span>
              Power Switch Group
            </button>

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

        {/* Outlets Section Header */}
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
            {stallData.map((stall) => {
              const isSaved = savedStallIds.includes(stall.id);
              const isToggling = togglingStallId === stall.id;

              return (
                <div key={stall.id} className={`mgr-card ${isSaved ? "mgr-card-saved" : ""}`}>

                  {/* Top Bar on Card: Saved Pin & Status */}
                  <div className="mgr-card-top-bar">
                    <button
                      type="button"
                      className={`mgr-card-pin-btn ${isSaved ? "is-pinned" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePinStall(stall.id, stall.name);
                      }}
                      title={isSaved ? "Included in Saved Group (Click to remove)" : "Add to Saved Group"}
                    >
                      {isSaved ? <FaBookmark className="mgr-pin-icon active" /> : <FaRegBookmark className="mgr-pin-icon" />}
                      <span className="mgr-pin-label">{isSaved ? "Saved" : "Save"}</span>
                    </button>

                    <span
                      className={`mgr-status-badge ${
                        stall.is_available ? "mgr-status-active" : "mgr-status-closed"
                      }`}
                    >
                      <span className="mgr-status-dot" />
                      {stall.is_available ? "Active" : "Closed"}
                    </span>
                  </div>

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
                    <div className="mgr-img-overlay">
                      <span className="mgr-img-overlay-text">View Items</span>
                    </div>
                  </div>

                  {/* Card Content & Instant Power Switch */}
                  <div className="mgr-card-footer">
                    <div className="mgr-card-info">
                      <p className="mgr-title" title={stall.name}>{stall.name}</p>
                      <div className="mgr-card-items-stat">
                        <span className={`mgr-status-text ${stall.is_available ? 'mgr-stat-active-items' : 'mgr-stat-inactive-items'}`}>
                          {stall.is_available ? "Open" : "Closed"}
                        </span>
                        {stall.payment_type && (
                          <>
                            <span className="mgr-stat-divider">•</span>
                            <span className="mgr-stat-active-items">{stall.payment_type}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Instant ON/OFF Switch & Edit Button */}
                    <div className="mgr-card-controls">
                      {/* Direct Toggle Power Switch */}
                      <button
                        type="button"
                        className={`mgr-card-power-toggle ${stall.is_available ? "is-on" : "is-off"}`}
                        disabled={isToggling}
                        onClick={(e) => handleToggleSingleStall(stall, e)}
                        title={stall.is_available ? "Turn Outlet OFF" : "Turn Outlet ON"}
                      >
                        {isToggling ? (
                          <FaSpinner className="mgr-spin-icon-sm" />
                        ) : (
                          <FaPowerOff />
                        )}
                        <span>{stall.is_available ? "ON" : "OFF"}</span>
                      </button>

                      {/* Edit Modal Button */}
                      <div
                        className="mgr-edit-btn"
                        title="Edit Outlet Details"
                        onClick={() => handleEditClick(stall)}
                      >
                        <FaEdit className="mgr-edit-icon" />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ⚙️ CONFIGURE SAVED OUTLETS MODAL ── */}
      {isConfigModalOpen && (
        <div className="mgr-modal" onClick={(e) => {
          if (e.target === e.currentTarget) setIsConfigModalOpen(false);
        }}>
          <div className="mgr-modal-box mgr-config-modal-box">
            
            {/* Modal Header */}
            <div className="mgr-modal-header">
              <div className="mgr-modal-title-wrap">
                <span className="mgr-modal-badge-icon">⚡</span>
                <div>
                  <h3>Select & Save Outlets</h3>
                  <p className="mgr-modal-sub">
                    Check the outlets you want to control together with the Master Power Switch.
                  </p>
                </div>
              </div>
              <button
                className="mgr-modal-close"
                onClick={() => setIsConfigModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Controls: Search & Select All */}
            <div className="mgr-config-controls">
              <div className="mgr-config-search">
                <FaSearch className="mgr-search-icon" />
                <input
                  type="text"
                  placeholder="Search outlets by name..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                />
                {modalSearchQuery && (
                  <button
                    className="mgr-search-clear"
                    onClick={() => setModalSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mgr-config-toolbar">
                <button
                  type="button"
                  className="mgr-btn-toolbar"
                  onClick={handleSelectAllModal}
                >
                  {filteredModalStalls.length > 0 &&
                  filteredModalStalls.every((s) => tempSelectedIds.includes(s.id)) ? (
                    <>
                      <FaSquare /> Deselect All
                    </>
                  ) : (
                    <>
                      <FaCheckSquare /> Select All
                    </>
                  )}
                </button>
                <div className="mgr-config-counter">
                  <strong>{tempSelectedIds.length}</strong> of {stallData.length} Selected
                </div>
              </div>
            </div>

            {/* Stalls Selectable List */}
            <div className="mgr-config-list">
              {filteredModalStalls.length === 0 ? (
                <div className="mgr-config-empty">
                  No outlets matching "{modalSearchQuery}"
                </div>
              ) : (
                filteredModalStalls.map((stall) => {
                  const isSelected = tempSelectedIds.includes(stall.id);
                  return (
                    <div
                      key={stall.id}
                      className={`mgr-config-item ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleToggleModalSelection(stall.id)}
                    >
                      <div className="mgr-config-checkbox">
                        {isSelected ? <FaCheckSquare className="checkbox-checked" /> : <FaSquare className="checkbox-unchecked" />}
                      </div>

                      <div className="mgr-config-img-wrap">
                        <img
                          src={stall.image_url}
                          alt={stall.name}
                          className="mgr-config-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>

                      <div className="mgr-config-info">
                        <span className="mgr-config-name">{stall.name}</span>
                        <div className="mgr-config-meta">
                          <span className={`mgr-config-status ${stall.is_available ? "status-on" : "status-off"}`}>
                            {stall.is_available ? "● Currently ON (Open)" : "○ Currently OFF (Closed)"}
                          </span>
                          {stall.payment_type && (
                            <span className="mgr-config-tag">{stall.payment_type}</span>
                          )}
                        </div>
                      </div>

                      <div className="mgr-config-select-pill">
                        {isSelected ? "Saved in Group" : "+ Select"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="mgr-modal-footer">
              <button
                type="button"
                className="mgr-btn-modal-cancel"
                onClick={() => setIsConfigModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mgr-btn-modal-update"
                onClick={handleSaveModalSelection}
              >
                <FaCheck /> Save Selection ({tempSelectedIds.length} Outlets)
              </button>
            </div>

          </div>
        </div>
      )}

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
                    {formData.is_available ? "Available (ON)" : "Unavailable (OFF)"}
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

      {/* ── 🔔 ALERT / WARNING POPUP MODAL (When stall already closed/open) ── */}
      {alertModal && (
        <div className="mgr-modal mgr-alert-modal-overlay" onClick={() => setAlertModal(null)}>
          <div className="mgr-modal-box mgr-alert-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className={`mgr-alert-icon-wrapper mgr-alert-icon-${alertModal.type || "warning"}`}>
              <span>{alertModal.icon || "⚠️"}</span>
            </div>
            <h3 className="mgr-alert-title">{alertModal.title}</h3>
            <p className="mgr-alert-message">{alertModal.message}</p>
            <div className="mgr-alert-actions">
              <button
                type="button"
                className="mgr-alert-btn"
                onClick={() => setAlertModal(null)}
                autoFocus
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

