import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./AIComboModal.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

const AIComboModal = ({ stallId, token, onClose, onComboPublished }) => {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [quota, setQuota] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch AI Recommendations from backend (with optional force_regenerate)
  const fetchRecommendations = useCallback(async (forceRegenerate = false) => {
    if (!stallId) return;
    try {
      if (forceRegenerate) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setErrorMsg("");

      const res = await axios.get(
        `${API_BASE}/combos/stall/${stallId}/ai-recommendations?force_regenerate=${forceRegenerate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAiData(res.data);
      if (res.data.quota) {
        setQuota(res.data.quota);
      }

      if (forceRegenerate) {
        setSuccessMsg("✨ Generated fresh AI combo recommendations!");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 429) {
        setErrorMsg(detail || "Weekly limit reached (2/2 used). Quota resets on next Monday.");
      } else {
        setErrorMsg(detail || "Failed to generate AI combos. Please make sure your stall has at least 2 menu items.");
      }
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [stallId, token]);

  useEffect(() => {
    fetchRecommendations(false);
  }, [fetchRecommendations]);

  // Handle click on "Regenerate Combos"
  const handleRegenerateClick = () => {
    if (!quota || quota.remaining <= 0) {
      setErrorMsg(`Weekly AI limit reached (${quota?.used || 2}/${quota?.weekly_limit || 2} used). Quota will reset on next ${quota?.resets_on || "Monday"}.`);
      return;
    }

    const confirmed = window.confirm(
      `Generating fresh AI combos will consume 1 of your weekly credits (${quota.remaining} remaining this week).\n\nDo you want to proceed?`
    );

    if (confirmed) {
      fetchRecommendations(true);
    }
  };

  // Flattened all combos
  const allCombos = useMemo(() => {
    if (!aiData || !aiData.categories) return [];
    return aiData.categories.flatMap((cat) =>
      cat.combos.map((c) => ({
        ...c,
        categoryId: cat.category_id,
        categoryName: cat.category_name,
        categoryTiming: cat.timing,
      }))
    );
  }, [aiData]);

  // Filtered by active tab
  const displayedCombos = useMemo(() => {
    if (activeCategory === "ALL") return allCombos;
    return allCombos.filter((c) => c.categoryId === activeCategory);
  }, [allCombos, activeCategory]);

  // Toggle selection for batch publish
  const toggleSelect = (combo) => {
    setSelectedCombos((prev) => {
      const exists = prev.some((c) => c.name === combo.name);
      if (exists) {
        return prev.filter((c) => c.name !== combo.name);
      } else {
        return [...prev, combo];
      }
    });
  };

  const selectAllInView = () => {
    if (selectedCombos.length === displayedCombos.length) {
      setSelectedCombos([]);
    } else {
      setSelectedCombos([...displayedCombos]);
    }
  };

  // Submit single combo for OM approval
  const handlePublishSingle = async (combo) => {
    try {
      setPublishing(true);
      setErrorMsg("");
      await axios.post(
        `${API_BASE}/combos/stall/${stallId}/ai-publish-batch`,
        [combo],
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`🎉 Submitted "${combo.name}" for OM Approval! It will be reviewed by Operations Manager.`);
      setTimeout(() => setSuccessMsg(""), 3500);
      onComboPublished();
    } catch (err) {
      console.error("Error submitting AI combo for approval:", err);
      setErrorMsg("Failed to submit combo. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  // Submit selected combos in batch for OM approval
  const handlePublishBatch = async () => {
    if (selectedCombos.length === 0) return;
    try {
      setPublishing(true);
      setErrorMsg("");
      await axios.post(
        `${API_BASE}/combos/stall/${stallId}/ai-publish-batch`,
        selectedCombos,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`🎉 Successfully submitted ${selectedCombos.length} combo pack(s) for OM Approval!`);
      setSelectedCombos([]);
      setTimeout(() => {
        setSuccessMsg("");
        onComboPublished();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error bulk submitting AI combos for approval:", err);
      setErrorMsg("Failed to submit combos. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="ai-modal-header">
          <div className="ai-header-title-row">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div className="ai-badge-studio">
                <span className="ai-sparkle-icon">✨</span>
                <span>AI Combo Studio</span>
              </div>
              {aiData?.powered_by && (
                <span className="ai-badge-engine">
                  ⚡ {aiData.powered_by}
                </span>
              )}
              {/* Weekly Quota Badge */}
              {quota && (
                <div className={`ai-badge-quota ${quota.remaining === 0 ? "exhausted" : ""}`}>
                  <span>⚡ Weekly Quota: <strong>{quota.remaining}/{quota.weekly_limit}</strong> left</span>
                  <span className="ai-quota-reset-hint">(Resets next {quota.resets_on})</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Regenerate Fresh Combos Button */}
              {aiData && (
                <button
                  className="ai-regenerate-btn"
                  onClick={handleRegenerateClick}
                  disabled={loading || regenerating || (quota && quota.remaining <= 0)}
                  title={
                    quota && quota.remaining <= 0
                      ? "Weekly limit reached (2/2 used). Resets next Monday."
                      : "Generate fresh AI combos (Uses 1 weekly credit)"
                  }
                >
                  {regenerating ? "🔄 Generating..." : "🔄 Regenerate (1 Credit)"}
                </button>
              )}
              <button className="ai-close-btn" onClick={onClose}>
                ✕
              </button>
            </div>
          </div>

          <h2 className="ai-modal-headline">
            Smart Recommended Combo Packs
          </h2>
          <p className="ai-modal-subheadline">
            AI-analyzed combos tailored for office workers & IT park food courts with psychological pricing and instant 1-click publishing.
            {aiData?.is_cached && (
              <span className="ai-cached-pill">💾 Cached Weekly Recommendations</span>
            )}
          </p>

          {/* SUCCESS / ERROR ALERTS */}
          {successMsg && <div className="ai-alert-success">{successMsg}</div>}
          {errorMsg && <div className="ai-alert-error">{errorMsg}</div>}

          {/* CATEGORY TABS */}
          {aiData && aiData.categories && aiData.categories.length > 0 && (
            <div className="ai-category-tabs">
              <button
                className={`ai-tab-pill ${activeCategory === "ALL" ? "active" : ""}`}
                onClick={() => setActiveCategory("ALL")}
              >
                All Combos ({allCombos.length})
              </button>
              {aiData.categories.map((cat) => (
                <button
                  key={cat.category_id}
                  className={`ai-tab-pill ${activeCategory === cat.category_id ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.category_id)}
                >
                  {cat.category_name} ({cat.combos.length})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="ai-modal-body">
          {loading ? (
            <div className="ai-loading-state">
              <div className="ai-loading-spinner" />
              <h3>Analyzing stall menu items...</h3>
              <p>Evaluating dish pairings, portion costs, and food court price points.</p>
            </div>
          ) : displayedCombos.length === 0 ? (
            <div className="ai-empty-state">
              <span className="ai-empty-icon">🍱</span>
              <h3>No AI Recommendations Available</h3>
              <p>{aiData?.message || "Ensure your stall has multiple available items with prices."}</p>
            </div>
          ) : (
            <>
              <div className="ai-body-controls">
                <span className="ai-count-label">
                  Showing {displayedCombos.length} smart combo recommendations
                </span>
                <button className="ai-select-all-btn" onClick={selectAllInView}>
                  {selectedCombos.length === displayedCombos.length
                    ? "Deselect All"
                    : "Select All in Category"}
                </button>
              </div>

              <div className="ai-combos-grid">
                {displayedCombos.map((combo, idx) => {
                  const isSelected = selectedCombos.some((c) => c.name === combo.name);

                  return (
                    <div
                      key={idx}
                      className={`ai-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelect(combo)}
                    >
                      {/* CARD HEADER */}
                      <div className="ai-card-top">
                        <div className="ai-card-meta">
                          <span className={`ai-veg-tag ${combo.is_veg ? "veg" : "non-veg"}`}>
                            {combo.is_veg ? "● Veg" : "▲ Non-Veg"}
                          </span>
                          <span className="ai-pill-tag">{combo.tag || "✨ Recommended"}</span>
                          {combo.categoryTiming && (
                            <span className="ai-timing-tag">⏰ {combo.categoryTiming}</span>
                          )}
                        </div>

                        <input
                          type="checkbox"
                          className="ai-card-checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* COMBO NAME */}
                      <h3 className="ai-combo-name">{combo.name}</h3>

                      {/* INCLUDED ITEMS BREAKDOWN */}
                      <div className="ai-items-box">
                        <span className="ai-items-label">Includes ({combo.items.length} items):</span>
                        <div className="ai-item-chips">
                          {combo.items.map((it, itemIdx) => (
                            <div key={itemIdx} className="ai-item-chip">
                              <span className="ai-chip-qty">{it.quantity}×</span>
                              <span className="ai-chip-name">{it.name}</span>
                              <span className="ai-chip-price">₹{it.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PRICING ROW */}
                      <div className="ai-pricing-row">
                        <div className="ai-prices">
                          <span className="ai-combo-price">₹{combo.suggested_combo_price}</span>
                          <span className="ai-reg-price">₹{combo.regular_price}</span>
                        </div>
                        <span className="ai-save-badge">
                          Save ₹{combo.discount_amount} ({Math.round(combo.discount_percentage)}% OFF)
                        </span>
                      </div>

                      {/* MARKETING RATIONALE */}
                      {combo.marketing_reason && (
                        <div className="ai-rationale-box">
                          <strong>💡 Why it works:</strong> {combo.marketing_reason}
                        </div>
                      )}

                      {/* CARD ACTIONS */}
                      <div className="ai-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="ai-publish-btn"
                          disabled={publishing}
                          onClick={() => handlePublishSingle(combo)}
                        >
                          📝 Submit for OM Approval
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER - BULK SUBMIT BAR */}
        {selectedCombos.length > 0 && (
          <div className="ai-modal-footer">
            <div className="ai-footer-info">
              <span className="ai-footer-count">
                <strong>{selectedCombos.length}</strong> combo pack(s) selected
              </span>
              <span className="ai-footer-sub">
                Will be submitted to Operations Manager for review and approval.
              </span>
            </div>

            <div className="ai-footer-buttons">
              <button
                className="ai-footer-cancel-btn"
                onClick={() => setSelectedCombos([])}
              >
                Clear Selection
              </button>
              <button
                className="ai-footer-publish-btn"
                disabled={publishing}
                onClick={handlePublishBatch}
              >
                {publishing ? "Submitting..." : `📝 Submit Selected Combos for OM Approval (${selectedCombos.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIComboModal;
