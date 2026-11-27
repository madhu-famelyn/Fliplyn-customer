import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./WalletGroups.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatExpiry = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export default function WalletGroupMembers() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { token } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/wallet-group-balance/om/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroup(res.data?.group || null);
      setMembers(res.data?.members || []);
    } catch (err) {
      console.error("Failed to load wallet group members:", err);
      setError(
        err.response?.status === 404
          ? "Wallet group not found in your building."
          : "Failed to load members. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token, groupId]);

  const handleLoadGroupNow = async () => {
    if (!group) return;
    const activeCount = group.active_member_count ?? members.filter((m) => m.is_active).length;
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
        `${API_BASE_URL}/wallet-group-balance/om/${groupId}/load`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || "Group wallets loaded successfully!"}`);
      fetchDetail();
    } catch (err) {
      console.error("Failed to load wallets:", err);
      setError(err.response?.data?.detail || "Failed to load wallets. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearGroupNow = async () => {
    if (!group) return;
    const confirmed = window.confirm(
      `🗑 Clear group balance for "${group.group_name}"?\n\n` +
      `• Remaining group funds: ${formatMoney(group.remaining)}\n` +
      `• Active members: ${group.active_member_count}\n\n` +
      `⚠️ NOTE: This clears ONLY the group-funded balance for all members. Members' own top-ups (self-loaded money) will NOT be deleted.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/${groupId}/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || "Group balance cleared successfully!"}`);
      fetchDetail();
    } catch (err) {
      console.error("Failed to clear group balance:", err);
      setError(err.response?.data?.detail || "Failed to clear group balance. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadSingleMember = async (member) => {
    if (!member.user_id || !group) return;
    const defaultAmount = group.per_user_amount ?? 0;
    const rawInput = window.prompt(
      `Load wallet for ${member.name || member.email}\n\n` +
      `Current group balance: ${formatMoney(member.group_balance)}\n` +
      `Enter amount to load (₹):`,
      String(defaultAmount)
    );
    if (rawInput === null) return;

    const parsedAmount = Number(rawInput.trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/${groupId}/members/${member.user_id}/load`,
        {},
        {
          params: { amount: parsedAmount },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActionMsg(
        `✅ ${res.data?.message || `Loaded ${formatMoney(parsedAmount)} for ${member.name || member.email}.`}`
      );
      fetchDetail();
    } catch (err) {
      console.error("Failed to load member wallet:", err);
      setError(err.response?.data?.detail || "Failed to load member wallet. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearSingleMember = async (member) => {
    if (!member.user_id) return;
    const confirmed = window.confirm(
      `Clear group balance for ${member.name || member.email}?\n\n` +
      `• Group balance to clear: ${formatMoney(member.group_balance)}\n` +
      `• Own (self-loaded) balance: ${formatMoney(member.own_balance)} (will NOT be touched)\n\n` +
      `Only the group/company part will be reset to ₹0.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionMsg("");
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/wallet-group-balance/om/${groupId}/members/${member.user_id}/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg(`✅ ${res.data?.message || `Cleared group balance for ${member.name || member.email}. Own balance retained.`}`);
      fetchDetail();
    } catch (err) {
      console.error("Failed to clear member group balance:", err);
      setError(err.response?.data?.detail || "Failed to clear member group balance. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
    );
  }, [members, search]);

  return (
    <div className="om-wg-wrapper">
      <div className="om-wg-hero">
        <div className="om-wg-hero-inner">
          <div>
            <button className="om-wg-back-btn" onClick={() => navigate("/om-wallet-groups")}>
              ← Back to Wallet Groups
            </button>
            <h1 className="om-wg-heading">{group ? group.group_name : "Wallet Group"}</h1>
          </div>
          <div className="om-wg-hero-actions">
            <button
              className="om-wg-load-all-btn"
              onClick={handleLoadGroupNow}
              disabled={loading || actionLoading || !group}
              title="Load quota for all active members now"
            >
              {actionLoading ? "Loading Wallets…" : "⚡ Load Wallets Now"}
            </button>
            <button
              className="om-wg-btn-clear-hero"
              onClick={handleClearGroupNow}
              disabled={loading || actionLoading || !group || group.remaining <= 0}
              title="Clear group balance only (self-loaded money is untouched)"
            >
              {actionLoading ? "Processing…" : "🗑 Clear Group Balance"}
            </button>
            <button className="om-wg-refresh-btn" onClick={fetchDetail} disabled={loading || actionLoading}>
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
        {group && (
          <div className="om-wg-totals">
            <div className="om-wg-total-card remaining">
              <span className="om-wg-total-label">Remaining</span>
              <span className="om-wg-total-value">{formatMoney(group.remaining)}</span>
            </div>
            <div className="om-wg-total-card">
              <span className="om-wg-total-label">Loaded</span>
              <span className="om-wg-total-value">{formatMoney(group.loaded)}</span>
            </div>
            <div className="om-wg-total-card">
              <span className="om-wg-total-label">Spent</span>
              <span className="om-wg-total-value">{formatMoney(group.spent)}</span>
            </div>
            <div className="om-wg-total-card">
              <span className="om-wg-total-label">Members</span>
              <span className="om-wg-total-value">
                {group.active_member_count} / {group.member_count}
              </span>
            </div>
          </div>
        )}

        <input
          type="text"
          className="om-wg-search"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <p className="om-wg-error">{error}</p>}

        {loading ? (
          <p className="om-wg-empty">Loading members…</p>
        ) : !error && filteredMembers.length === 0 ? (
          <p className="om-wg-empty">{search ? "No members match your search." : "No members in this group."}</p>
        ) : (
          !error && (
            <div className="om-wg-table-wrapper">
              <table className="om-wg-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="num">Group balance</th>
                    <th className="num">Own balance</th>
                    <th className="num">Total</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m, i) => (
                    <tr key={m.user_id || m.email || i} className={m.is_active ? "" : "inactive"}>
                      <td>{m.name || "—"}</td>
                      <td>{m.email || "—"}</td>
                      <td>{m.phone || "—"}</td>
                      <td>
                        <span className={`om-wg-status ${m.is_active ? "active" : "off"}`}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {m.has_wallet ? (
                        <>
                          <td className="num">{formatMoney(m.group_balance)}</td>
                          <td className="num">{formatMoney(m.own_balance)}</td>
                          <td className="num strong">{formatMoney(m.total_balance)}</td>
                          <td>{formatExpiry(m.expiry_at)}</td>
                          <td>
                            <div className="om-wg-member-actions">
                              {m.user_id && (
                                <button
                                  type="button"
                                  className="om-wg-member-load-btn"
                                  onClick={() => handleLoadSingleMember(m)}
                                  disabled={actionLoading}
                                  title="Load wallet balance for this member only"
                                >
                                  Load Wallet
                                </button>
                              )}
                              {m.group_balance > 0 && (
                                <button
                                  type="button"
                                  className="om-wg-member-clear-btn"
                                  onClick={() => handleClearSingleMember(m)}
                                  disabled={actionLoading}
                                  title="Clear group balance for this member only (own balance is retained)"
                                >
                                  Clear Group
                                </button>
                              )}
                              {!m.user_id && m.group_balance <= 0 && (
                                <span className="muted" style={{ fontSize: "0.8rem" }}>—</span>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td colSpan={4} className="muted">
                            {m.user_id ? "No wallet yet" : "Not registered yet"}
                          </td>
                          <td>
                            {m.user_id ? (
                              <button
                                type="button"
                                className="om-wg-member-load-btn"
                                onClick={() => handleLoadSingleMember(m)}
                                disabled={actionLoading}
                                title="Create and load wallet for this member"
                              >
                                Load Wallet
                              </button>
                            ) : (
                              <span className="muted" style={{ fontSize: "0.8rem" }}>—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
