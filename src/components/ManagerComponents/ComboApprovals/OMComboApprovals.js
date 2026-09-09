import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import "./OMComboApprovals.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

export default function OMComboApprovals() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [stalls, setStalls] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedStallId, setSelectedStallId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | VEG | NON_VEG
  const [searchTerm, setSearchTerm] = useState("");

  // Loading state for single actions
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  // Modern In-App Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Modals State (replaces prompt/confirm)
  const [rejectModal, setRejectModal] = useState({ isOpen: false, comboId: null, comboName: "", reason: "" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, comboId: null, comboName: "" });
  const [bulkModal, setBulkModal] = useState(false);

  /* ---------------- 1. FETCH STALLS & COMBOS ---------------- */
  const fetchData = useCallback(async () => {
    if (!user?.building_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch stalls for this building
      const stallsRes = await axios.get(
        `${API_BASE_URL}/stalls/building/${user.building_id}`,
        { headers: authHeaders }
      );
      const stallsList = stallsRes.data || [];
      setStalls(stallsList);

      // Fetch all combos for this building
      const combosRes = await axios.get(
        `${API_BASE_URL}/combos/building/${user.building_id}`,
        { headers: authHeaders }
      );
      setCombos(Array.isArray(combosRes.data) ? combosRes.data : []);
    } catch (err) {
      console.error("❌ Error fetching combos for OM:", err);
      setError("Failed to load combo approvals. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- MAP STALL ID TO STALL NAME ---------------- */
  const stallMap = useMemo(() => {
    const map = {};
    stalls.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [stalls]);

  /* ---------------- STATS COUNTS ---------------- */
  const pendingCount = useMemo(
    () => combos.filter((c) => c.approval_status === "PENDING").length,
    [combos]
  );
  const approvedCount = useMemo(
    () => combos.filter((c) => c.approval_status === "APPROVED").length,
    [combos]
  );
  const rejectedCount = useMemo(
    () => combos.filter((c) => c.approval_status === "REJECTED").length,
    [combos]
  );

  /* ---------------- FILTERED COMBOS ---------------- */
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      // Stall filter
      if (selectedStallId !== "ALL" && combo.stall_id !== selectedStallId) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && combo.approval_status !== statusFilter) {
        return false;
      }

      // Type filter (veg / non-veg)
      if (typeFilter === "VEG" && !combo.is_veg) return false;
      if (typeFilter === "NON_VEG" && combo.is_veg) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const stallName = (stallMap[combo.stall_id] || "").toLowerCase();
        const comboName = (combo.name || "").toLowerCase();
        const desc = (combo.description || "").toLowerCase();
        const itemsStr = (combo.items_json || [])
          .map((i) => i.name)
          .join(" ")
          .toLowerCase();

        if (
          !comboName.includes(term) &&
          !stallName.includes(term) &&
          !desc.includes(term) &&
          !itemsStr.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [combos, selectedStallId, statusFilter, typeFilter, searchTerm, stallMap]);

  /* ---------------- APPROVAL ACTIONS ---------------- */
  const handleApprove = async (comboId, comboName) => {
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
      showToast(`✅ Combo "${comboName}" approved! It is now live in the stall menu.`, "success");
    } catch (err) {
      console.error("Error approving combo:", err);
      showToast("❌ Failed to approve combo. Please try again.", "error");
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
      // Update local state directly
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
      showToast("❌ Failed to reject combo. Please try again.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkApprovePending = async () => {
    const pendingCombos = combos.filter((c) => c.approval_status === "PENDING");
    if (pendingCombos.length === 0) {
      showToast("No pending combos to approve.", "info");
      return;
    }

    try {
      setBulkApproving(true);
      setBulkModal(false);
      await Promise.all(
        pendingCombos.map((c) =>
          axios.patch(
            `${API_BASE_URL}/combos/${c.id}/approve`,
            { action: "APPROVE", manager_id: user?.id },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
        )
      );
      showToast(`✅ Successfully approved all ${pendingCombos.length} combo packs!`, "success");
      fetchData();
    } catch (err) {
      console.error("Error bulk approving combos:", err);
      showToast("Some combos could not be approved. Refreshing...", "error");
      fetchData();
    } finally {
      setBulkApproving(false);
    }
  };

  const handleToggleActive = async (comboId, currentActive, approvalStatus) => {
    if (approvalStatus !== "APPROVED") {
      showToast("⚠️ Combos pending OM approval cannot be activated until approved.", "error");
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
      showToast("Failed to toggle combo status.", "error");
      fetchData();
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

  return (
    <div className="om-ca-wrapper">
      {/* ── Top Hero Header ── */}
      <div className="om-ca-hero">
        <div className="om-ca-hero-inner">
          <div className="om-ca-hero-left">
            <button className="om-ca-back-btn" onClick={() => navigate("/manager-stalls")}>
              ← Back to Outlets
            </button>
            <h1 className="om-ca-heading">🍱 Combo Pack Approvals</h1>
            <p className="om-ca-subheading">
              Review, approve, or reject AI & vendor-generated combo packs across all outlets in your building.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="om-ca-stats">
            <div
              className={`om-ca-stat-pill ${statusFilter === "ALL" ? "active-filter" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              <span className="stat-dot dot-all" />
              <span className="stat-num">{loading ? "—" : combos.length}</span>
              Total Combos
            </div>
            <div
              className={`om-ca-stat-pill pending ${statusFilter === "PENDING" ? "active-filter" : ""}`}
              onClick={() => setStatusFilter("PENDING")}
            >
              <span className="stat-dot dot-pending" />
              <span className="stat-num">{loading ? "—" : pendingCount}</span>
              Pending Approval
            </div>
            <div
              className={`om-ca-stat-pill approved ${statusFilter === "APPROVED" ? "active-filter" : ""}`}
              onClick={() => setStatusFilter("APPROVED")}
            >
              <span className="stat-dot dot-approved" />
              <span className="stat-num">{loading ? "—" : approvedCount}</span>
              Approved
            </div>
            <div
              className={`om-ca-stat-pill rejected ${statusFilter === "REJECTED" ? "active-filter" : ""}`}
              onClick={() => setStatusFilter("REJECTED")}
            >
              <span className="stat-dot dot-rejected" />
              <span className="stat-num">{loading ? "—" : rejectedCount}</span>
              Rejected
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="om-ca-content">
        {/* Bulk Action Banner if Pending items exist */}
        {pendingCount > 0 && (
          <div className="om-ca-pending-alert-banner">
            <div className="om-ca-pending-alert-text">
              <span className="om-ca-alert-icon">⚡</span>
              <div>
                <strong>{pendingCount} Combo Pack{pendingCount > 1 ? "s" : ""} Awaiting Approval</strong>
                <p>Vendors have submitted combo packs for your review. Approve them so they go live in stall menus.</p>
              </div>
            </div>
            <button
              className="om-ca-bulk-approve-btn"
              disabled={bulkApproving}
              onClick={() => setBulkModal(true)}
            >
              {bulkApproving ? "Approving All..." : `✅ Approve All (${pendingCount})`}
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="om-ca-controls-card">
          <div className="om-ca-search-box">
            <input
              type="text"
              className="om-ca-search-input"
              placeholder="Search combos by name, stall name, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="om-ca-clear-search" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          <div className="om-ca-filter-row">
            {/* Stall Selector */}
            <select
              className="om-ca-select"
              value={selectedStallId}
              onChange={(e) => setSelectedStallId(e.target.value)}
            >
              <option value="ALL">🏪 All Outlets ({stalls.length})</option>
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Veg / Non-Veg Type */}
            <select
              className="om-ca-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types (Veg & Non-Veg)</option>
              <option value="VEG">🟢 Veg Only</option>
              <option value="NON_VEG">🔴 Non-Veg Only</option>
            </select>

            {/* Status Selector */}
            <select
              className="om-ca-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({combos.length})</option>
              <option value="PENDING">⏳ Pending OM Approval ({pendingCount})</option>
              <option value="APPROVED">✅ Approved ({approvedCount})</option>
              <option value="REJECTED">❌ Rejected ({rejectedCount})</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="om-ca-loading-box">
            <div className="om-ca-spinner" />
            <p>Loading combo packs and outlets...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="om-ca-error-box">
            <span>⚠️ {error}</span>
            <button onClick={fetchData} className="om-ca-retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCombos.length === 0 && (
          <div className="om-ca-empty-box">
            <div className="om-ca-empty-icon">🍱</div>
            <h3>No Combo Packs Found</h3>
            <p>
              {searchTerm || selectedStallId !== "ALL" || statusFilter !== "ALL"
                ? "No combo packs match your current filters. Try changing or clearing your search."
                : "No combo packs have been submitted by vendors yet."}
            </p>
            {(searchTerm || selectedStallId !== "ALL" || statusFilter !== "ALL" || typeFilter !== "ALL") && (
              <button
                className="om-ca-reset-btn"
                onClick={() => {
                  setSelectedStallId("ALL");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                  setSearchTerm("");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Combos Grid */}
        {!loading && !error && filteredCombos.length > 0 && (
          <div className="om-ca-grid">
            {filteredCombos.map((combo) => {
              const stallName = stallMap[combo.stall_id] || "Outlet";
              const isPending = combo.approval_status === "PENDING";
              const isApproved = combo.approval_status === "APPROVED";
              const isRejected = combo.approval_status === "REJECTED";

              return (
                <div
                  key={combo.id}
                  className={`om-ca-card ${combo.approval_status.toLowerCase()}`}
                >
                  {/* Outlet & Status Top Header */}
                  <div className="om-ca-card-header">
                    <span
                      className="om-ca-stall-badge"
                      title="Click to view stall items"
                      onClick={() => navigate(`/manager-items/${combo.stall_id}`)}
                    >
                      🏪 {stallName}
                    </span>

                    {/* Status Pill */}
                    {isPending && (
                      <span className="om-ca-status-badge pending">
                        ⏳ Pending Approval
                      </span>
                    )}
                    {isApproved && (
                      <span className="om-ca-status-badge approved">
                        ✅ Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="om-ca-status-badge rejected" title={combo.rejection_reason}>
                        ❌ Rejected
                      </span>
                    )}
                  </div>

                  {/* Combo Image (if available) */}
                  {combo.image_url ? (
                    <div className="om-ca-img-container">
                      <img
                        src={combo.image_url}
                        alt={combo.name}
                        className="om-ca-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="om-ca-img-placeholder">
                      <span>🍱</span>
                    </div>
                  )}

                  {/* Combo Title & Vegetarian Indicator */}
                  <div className="om-ca-title-row">
                    <span className={`om-ca-veg-badge ${combo.is_veg ? "veg" : "non-veg"}`}>
                      {combo.is_veg ? "🟢 Veg" : "🔴 Non-Veg"}
                    </span>
                    <h3 className="om-ca-combo-name" title={combo.name}>
                      {combo.name}
                    </h3>
                  </div>

                  {/* Description */}
                  {combo.description && (
                    <p className="om-ca-combo-desc">{combo.description}</p>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {isRejected && combo.rejection_reason && (
                    <div className="om-ca-rejection-note">
                      <strong>Rejection Reason:</strong> {combo.rejection_reason}
                    </div>
                  )}

                  {/* Included Items Breakdown */}
                  <div className="om-ca-items-box">
                    <div className="om-ca-items-label">
                      Includes ({combo.items_json?.length || 0} Items):
                    </div>
                    <div className="om-ca-chips-container">
                      {combo.items_json?.map((it, idx) => (
                        <div key={idx} className="om-ca-item-chip">
                          <span className="om-ca-item-qty">{it.quantity}×</span>
                          <span className="om-ca-item-name">{it.name}</span>
                          <span className="om-ca-item-price">₹{it.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & Savings Row */}
                  <div className="om-ca-pricing-card">
                    <div className="om-ca-prices">
                      <span className="om-ca-final-price">₹{combo.combo_price}</span>
                      <span className="om-ca-reg-price">₹{combo.regular_price}</span>
                    </div>
                    <div className="om-ca-discount-tag">
                      Save ₹{combo.discount_amount} ({Math.round(combo.discount_percentage)}% OFF)
                    </div>
                  </div>

                  {/* Live Status Switch for Approved Combos */}
                  {isApproved && (
                    <div className="om-ca-switch-row">
                      <span className="om-ca-switch-label">
                        Stall Menu Status: <strong>{combo.is_active ? "🟢 Active (ON)" : "⚪ Hidden (OFF)"}</strong>
                      </span>
                      <label className="switch" title="Toggle active status in customer menu">
                        <input
                          type="checkbox"
                          checked={combo.is_active}
                          onChange={() =>
                            handleToggleActive(combo.id, combo.is_active, combo.approval_status)
                          }
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="om-ca-actions-row">
                    {isPending && (
                      <>
                        <button
                          className="om-ca-btn-approve"
                          disabled={actionLoadingId === combo.id}
                          onClick={() => handleApprove(combo.id, combo.name)}
                        >
                          {actionLoadingId === combo.id ? "Approving..." : "✅ Approve"}
                        </button>
                        <button
                          className="om-ca-btn-reject"
                          disabled={actionLoadingId === combo.id}
                          onClick={() => openRejectModal(combo.id, combo.name)}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}

                    {isRejected && (
                      <button
                        className="om-ca-btn-approve"
                        disabled={actionLoadingId === combo.id}
                        onClick={() => handleApprove(combo.id, combo.name)}
                      >
                        {actionLoadingId === combo.id ? "Approving..." : "✅ Re-Approve"}
                      </button>
                    )}

                    {isApproved && (
                      <button
                        className="om-ca-btn-reject"
                        disabled={actionLoadingId === combo.id}
                        onClick={() => openRejectModal(combo.id, combo.name)}
                      >
                        ❌ Revoke / Reject
                      </button>
                    )}

                    <button
                      className="om-ca-btn-delete"
                      onClick={() => openDeleteModal(combo.id, combo.name)}
                      title="Delete combo pack"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modern Floating Toast Notification ── */}
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

      {/* ── Reject Modal Dialog ── */}
      {rejectModal.isOpen && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>❌ Reject Combo Pack</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "-10px 0 15px 0" }}>
              Optionally enter feedback or reason for rejecting <strong>"{rejectModal.comboName}"</strong>:
            </p>
            <textarea
              rows="3"
              placeholder="e.g. Discount too steep, items not available, etc."
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

      {/* ── Delete Modal Dialog ── */}
      {deleteModal.isOpen && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>🗑️ Delete Combo Pack</h3>
            <p style={{ fontSize: "14px", color: "#334155", margin: "10px 0 20px 0" }}>
              Are you sure you want to permanently delete <strong>"{deleteModal.comboName}"</strong>? This cannot be undone.
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

      {/* ── Bulk Approve Modal Dialog ── */}
      {bulkModal && (
        <div className="ils-modal">
          <div className="ils-modal-content">
            <h3>⚡ Bulk Approve Combo Packs</h3>
            <p style={{ fontSize: "14px", color: "#334155", margin: "10px 0 20px 0" }}>
              Are you sure you want to approve all <strong>{pendingCount}</strong> pending combo pack(s)? They will immediately become live in their respective stall menus.
            </p>
            <div className="ils-modal-buttons">
              <button
                type="button"
                className="ils-cancel-btn"
                onClick={() => setBulkModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ils-save-btn"
                style={{ background: "#16a34a" }}
                onClick={handleBulkApprovePending}
              >
                Approve All ({pendingCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
