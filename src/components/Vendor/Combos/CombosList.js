import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import AIComboModal from "./AIComboModal";
import EditComboModal from "./EditComboModal";
import "./CombosList.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

const CombosList = ({ stallId, token, stallItems }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [quota, setQuota] = useState(null);

  const fetchQuota = useCallback(async () => {
    if (!stallId || !token) return;
    try {
      const res = await axios.get(`${API_BASE}/combos/stall/${stallId}/ai-quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuota(res.data);
    } catch (err) {
      console.error("Error fetching AI quota:", err);
    }
  }, [stallId, token]);

  const fetchCombos = useCallback(async () => {
    if (!stallId || !token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/combos/stall/${stallId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCombos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching combos:", err);
    } finally {
      setLoading(false);
    }
  }, [stallId, token]);

  useEffect(() => {
    fetchCombos();
    fetchQuota();
  }, [fetchCombos, fetchQuota]);

  const handleToggleStatus = async (comboId, currentStatus) => {
    // Optimistic update
    setCombos((prev) =>
      prev.map((c) => (c.id === comboId ? { ...c, is_active: !currentStatus } : c))
    );

    try {
      await axios.patch(
        `${API_BASE}/combos/${comboId}/toggle-status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error toggling combo status:", err);
      // Revert on error
      fetchCombos();
    }
  };

  const handleDeleteCombo = async (comboId, comboName) => {
    if (!window.confirm(`Are you sure you want to delete "${comboName}"?`)) return;

    try {
      await axios.delete(`${API_BASE}/combos/${comboId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCombos((prev) => prev.filter((c) => c.id !== comboId));
    } catch (err) {
      console.error("Error deleting combo:", err);
      alert("Failed to delete combo pack. Please try again.");
    }
  };

  const filteredCombos = useMemo(() => {
    return combos
      .filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => {
        if (filter === "ACTIVE") return c.is_active && c.approval_status === "APPROVED";
        if (filter === "PENDING") return c.approval_status === "PENDING";
        if (filter === "INACTIVE") return !c.is_active && c.approval_status === "APPROVED";
        return true;
      });
  }, [combos, search, filter]);

  return (
    <div className="combos-container">
      {/* Top action bar */}
      <div className="combos-topbar">
        <div className="combos-search-filter">
          <input
            className="combos-search"
            placeholder="Search combos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="combos-filters">
            <button
              className={filter === "ALL" ? "active" : ""}
              onClick={() => setFilter("ALL")}
            >
              All ({combos.length})
            </button>
            <button
              className={filter === "ACTIVE" ? "active" : ""}
              onClick={() => setFilter("ACTIVE")}
            >
              Active ({combos.filter((c) => c.is_active && c.approval_status === "APPROVED").length})
            </button>
            <button
              className={filter === "PENDING" ? "active" : ""}
              onClick={() => setFilter("PENDING")}
            >
              Pending Approval ({combos.filter((c) => c.approval_status === "PENDING").length})
            </button>
            <button
              className={filter === "INACTIVE" ? "active" : ""}
              onClick={() => setFilter("INACTIVE")}
            >
              Inactive ({combos.filter((c) => !c.is_active && c.approval_status === "APPROVED").length})
            </button>
          </div>
        </div>

        <div className="combos-topbar-actions">
          {quota && (
            <div className={`combos-ai-quota-badge ${quota.remaining === 0 ? "exhausted" : ""}`}>
              <span className="combos-quota-dot">⚡</span>
              <span>
                AI Quota: <strong>{quota.remaining}/{quota.weekly_limit}</strong> Left
              </span>
            </div>
          )}
          <button
            className="ai-generate-combos-btn"
            onClick={() => setIsAiModalOpen(true)}
          >
            ✨ AI Generate Combos
          </button>
        </div>
      </div>

      {/* Combos Grid / List */}
      {loading ? (
        <p className="combos-loading">Loading combos...</p>
      ) : filteredCombos.length === 0 ? (
        <div className="combos-empty-card">
          <div className="combos-empty-icon">🍱</div>
          <h3>No Combo Packs Found</h3>
          <p>
            Generate smart, high-converting combo packs using AI tailored for IT park food courts and corporate employees!
          </p>
          <div className="combos-empty-actions">
            <button
              className="ai-generate-combos-btn-large"
              onClick={() => setIsAiModalOpen(true)}
            >
              ✨ Generate AI Combos
            </button>
          </div>
        </div>
      ) : (
        <div className="combos-grid">
          {filteredCombos.map((combo) => (
            <div key={combo.id} className={`combo-card ${!combo.is_active ? "inactive" : ""}`}>
              {combo.image_url && (
                <div className="combo-card-image-wrapper">
                  <img src={combo.image_url} alt={combo.name} className="combo-card-image" />
                </div>
              )}

              {/* Approval status banner */}
              <div className="combo-approval-tag-row">
                {combo.approval_status === "PENDING" && (
                  <span className="combo-approval-pill pending">
                    ⏳ Pending OM Approval
                  </span>
                )}
                {combo.approval_status === "APPROVED" && (
                  <span className="combo-approval-pill approved">
                    ✅ Approved by OM
                  </span>
                )}
                {combo.approval_status === "REJECTED" && (
                  <span className="combo-approval-pill rejected" title={combo.rejection_reason || "Rejected by OM"}>
                    ❌ Rejected ({combo.rejection_reason || "Check with OM"})
                  </span>
                )}
              </div>

              <div className="combo-card-header">
                <div className="combo-title-area">
                  <span className={`combo-veg-dot ${combo.is_veg ? "veg" : "non-veg"}`}>●</span>
                  <div>
                    <h4 className="combo-card-name">{combo.name}</h4>
                    {combo.description && (
                      <p className="combo-card-desc">{combo.description}</p>
                    )}
                  </div>
                </div>

                <label
                  className={`combo-switch ${combo.approval_status !== "APPROVED" ? "disabled-switch" : ""}`}
                  title={
                    combo.approval_status !== "APPROVED"
                      ? "Pending OM Approval. Cannot turn ON until approved."
                      : combo.is_active
                      ? "Active (Click to turn OFF)"
                      : "Inactive (Click to turn ON)"
                  }
                >
                  <input
                    type="checkbox"
                    checked={!!combo.is_active}
                    disabled={combo.approval_status !== "APPROVED"}
                    onChange={() => handleToggleStatus(combo.id, combo.is_active)}
                  />
                  <span />
                </label>
              </div>

              {/* Components list */}
              <div className="combo-card-components">
                <span className="combo-comp-label">Includes:</span>
                <div className="combo-comp-chips">
                  {combo.items_json?.map((it, idx) => (
                    <span key={idx} className="combo-comp-chip">
                      <strong>{it.quantity}×</strong> {it.name} <small>(₹{it.price})</small>
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Savings */}
              <div className="combo-card-pricing">
                <div className="combo-price-block">
                  <span className="combo-selling-price">₹{combo.combo_price}</span>
                  <span className="combo-reg-price">₹{combo.regular_price}</span>
                </div>

                <div className="combo-save-badge">
                  Save ₹{combo.discount_amount} ({Math.round(combo.discount_percentage)}% OFF)
                </div>
              </div>

              {/* Card Actions */}
              <div className="combo-card-actions">
                <button
                  className="combo-edit-btn"
                  onClick={() => setEditingCombo(combo)}
                >
                  ✏️ Edit / Add Image
                </button>
                <button
                  className="combo-delete-btn"
                  onClick={() => handleDeleteCombo(combo.id, combo.name)}
                >
                  🗑️ Delete Combo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Combo Generator Modal */}
      {isAiModalOpen && (
        <AIComboModal
          stallId={stallId}
          token={token}
          onClose={() => setIsAiModalOpen(false)}
          onComboPublished={() => {
            fetchCombos();
            fetchQuota();
          }}
        />
      )}

      {/* Edit / Add Image Modal */}
      {editingCombo && (
        <EditComboModal
          combo={editingCombo}
          stallId={stallId}
          token={token}
          stallItems={stallItems}
          onClose={() => setEditingCombo(null)}
          onComboUpdated={fetchCombos}
        />
      )}
    </div>
  );
};

export default CombosList;
