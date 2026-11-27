import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./WalletGroups.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function WalletGroups() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const fetchBalances = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/wallet-group-balance/om`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(res.data?.groups || []);
    } catch (err) {
      console.error("Failed to load wallet group balances:", err);
      setError("Failed to load wallet group balances. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleLoadSingleGroup = async (e, group) => {
    e.stopPropagation();
    const activeCount = group.active_member_count ?? group.member_count ?? 0;
    const confirmed = window.confirm(
      `Load wallets for "${group.group_name}"?\n\n` +
      `• Amount per user: ${formatMoney(group.per_user_amount)}\n` +
      `• Active members: ${activeCount}\n\n` +
      `This will immediately load the wallet quota for all active members in this group.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/${group.group_id}/load`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || "Group wallets loaded successfully!"}`);
      fetchBalances();
    } catch (err) {
      console.error("Failed to load group wallets:", err);
      setError(err.response?.data?.detail || "Failed to load group wallets. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearGroupBalance = async (e, group) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `🗑 Clear group balance for "${group.group_name}"?\n\n` +
      `• Remaining group funds: ${formatMoney(group.remaining)}\n` +
      `• Total members: ${group.member_count}\n\n` +
      `⚠️ NOTE: This clears ONLY the group-funded balance. Members' self-loaded (own top-up) balance will NOT be deleted.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/${group.group_id}/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || "Group balance cleared successfully!"}`);
      fetchBalances();
    } catch (err) {
      console.error("Failed to clear group balance:", err);
      setError(err.response?.data?.detail || "Failed to clear group balance. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadAllGroups = async () => {
    if (!groups.length) return;
    const confirmed = window.confirm(
      `⚠️ Load wallets for ALL ${groups.length} groups in your building?\n\n` +
      `This will credit all active members across every group with their daily quota. Use this if the automatic midnight run was missed.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/load-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || "All group wallets loaded successfully!"}`);
      fetchBalances();
    } catch (err) {
      console.error("Failed to load all groups:", err);
      setError(err.response?.data?.detail || "Failed to load all groups. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.group_name?.toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div className="om-wg-wrapper">
      <div className="om-wg-hero">
        <div className="om-wg-hero-inner">
          <div>
            <button className="om-wg-back-btn" onClick={() => navigate("/manager-stalls")}>
              ← Back to Outlets
            </button>
            <h1 className="om-wg-heading">💼 Wallet Groups</h1>
          </div>
          <div className="om-wg-hero-actions">
            <button
              className="om-wg-load-all-btn"
              onClick={handleLoadAllGroups}
              disabled={loading || actionLoading || groups.length === 0}
              title="Manually trigger load for all groups in this building"
            >
              {actionLoading ? "Processing…" : "⚡ Load All Groups"}
            </button>
            <button className="om-wg-refresh-btn" onClick={fetchBalances} disabled={loading || actionLoading}>
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="om-wg-body">
        {actionMsg && (
          <div className="om-wg-success-banner">
            <span>{actionMsg}</span>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: "#065f46" }}
              onClick={() => setActionMsg("")}
            >
              ✕
            </button>
          </div>
        )}
        <input
          type="text"
          className="om-wg-search"
          placeholder="Search groups…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <p className="om-wg-error">{error}</p>}

        {loading ? (
          <p className="om-wg-empty">Loading wallet groups…</p>
        ) : filteredGroups.length === 0 ? (
          <p className="om-wg-empty">
            {search ? "No groups match your search." : "No wallet groups in this building."}
          </p>
        ) : (
          <div className="om-wg-grid">
            {filteredGroups.map((g) => {
              const usedPct = g.loaded > 0 ? Math.min(100, Math.round((g.spent / g.loaded) * 100)) : 0;
              return (
                <div
                  className="om-wg-card clickable"
                  key={g.group_id}
                  onClick={() => navigate(`/om-wallet-groups/${g.group_id}`)}
                >
                  <div className="om-wg-card-header">
                    <h3 className="om-wg-card-title" title={g.group_name}>{g.group_name}</h3>
                    {g.payment_method && <span className="om-wg-badge">{g.payment_method}</span>}
                  </div>

                  <div className="om-wg-remaining">
                    <span className="om-wg-remaining-label">Remaining</span>
                    <span className="om-wg-remaining-value">{formatMoney(g.remaining)}</span>
                  </div>

                  <div className="om-wg-bar" aria-label={`${usedPct}% spent`}>
                    <div className="om-wg-bar-fill" style={{ width: `${usedPct}%` }} />
                  </div>

                  <div className="om-wg-meta">
                    <span>Loaded {formatMoney(g.loaded)}</span>
                    <span>Spent {formatMoney(g.spent)}</span>
                  </div>
                  <div className="om-wg-meta muted">
                    <span>{g.active_member_count} active / {g.member_count} members</span>
                    <span>{formatMoney(g.per_user_amount)} per user</span>
                  </div>
                  <div className="om-wg-card-actions">
                    <div className="om-wg-card-btns">
                      <button
                        type="button"
                        className="om-wg-btn-load"
                        onClick={(e) => handleLoadSingleGroup(e, g)}
                        disabled={actionLoading}
                        title="Load quota for active users in this group"
                      >
                        ⚡ Load Wallets
                      </button>
                      <button
                        type="button"
                        className="om-wg-btn-clear"
                        onClick={(e) => handleClearGroupBalance(e, g)}
                        disabled={actionLoading || g.remaining <= 0}
                        title="Clear group balance only (self-loaded money is untouched)"
                      >
                        🗑 Clear Group
                      </button>
                    </div>
                    <button
                      type="button"
                      className="om-wg-btn-view"
                      onClick={() => navigate(`/om-wallet-groups/${g.group_id}`)}
                    >
                      View Member Wallets →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
