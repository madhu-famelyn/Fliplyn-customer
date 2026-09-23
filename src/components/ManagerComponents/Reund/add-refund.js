import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiX,
  FiHash,
  FiDollarSign,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { useAuth } from "../../AuthContex/ContextAPI";
import RefundHistory from "./RefundHistory";
import "./AddRefund.css";

export default function RefundModal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    token_number: "",
    refund_amount: "",
    refund_reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshHistory, setRefreshHistory] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.admin_id) {
      setMessage("❌ Admin ID missing from context.");
      return;
    }

    if (!formData.token_number) {
      setMessage("❌ Token number is required.");
      return;
    }

    if (Number(formData.refund_amount) <= 0) {
      setMessage("❌ Refund amount must be greater than 0.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      admin_id: user.admin_id,
      manager_id: user?.id || null, // optional
      token_number: formData.token_number,
      refund_amount: Number(formData.refund_amount),
      refund_reason: formData.refund_reason,
    };

    try {
      const response = await axios.post(
        "https://admin-aged-field-2794.fly.dev/refunds/",
        payload
      );

      if (response.data?.success) {
        setMessage("✅ Refund processed successfully!");
        setFormData({
          token_number: "",
          refund_amount: "",
          refund_reason: "",
        });
        setRefreshHistory((prev) => !prev);
      } else {
        setMessage(
          "⚠️ Refund request sent but backend did not confirm success."
        );
      }
    } catch (err) {
      console.error(err);
      // Display backend validation message (e.g., refund > order total)
      const detail =
        err.response?.data?.detail ||
        "❌ Something went wrong while processing refund.";
      setMessage(`⚠️ ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const isError = message.startsWith("❌") || message.startsWith("⚠️");

  return (
    <div className="refund-wrapper">
      {/* Top Header Navigation Bar with Back Button */}
      <div className="ils-top-nav-bar">
        <button
          className="ils-back-btn"
          onClick={() => navigate("/manager-stalls")}
          title="Return to Outlets dashboard"
        >
          ← Back to Outlets
        </button>
      </div>

      {/* Open Button */}
      <button className="refund-open-btn" onClick={() => setIsOpen(true)}>
        <FiPlus size={16} />
        <span>Add Refund</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="refund-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="refund-modal-header">
              <div>
                <h2>Process Refund</h2>
                <p className="refund-modal-subtitle">
                  Refund a customer order back to their wallet
                </p>
              </div>
              <button
                className="refund-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="refund-form">
              <div className="refund-field">
                <label>Token Number</label>
                <div className="refund-input-group">
                  <FiHash className="refund-input-icon" />
                  <input
                    type="text"
                    name="token_number"
                    placeholder="e.g. SIU001"
                    value={formData.token_number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="refund-field">
                <label>Refund Amount</label>
                <div className="refund-input-group">
                  <FiDollarSign className="refund-input-icon" />
                  <input
                    type="number"
                    name="refund_amount"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.refund_amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="refund-field">
                <label>Refund Reason</label>
                <div className="refund-input-group refund-textarea-group">
                  <FiMessageSquare className="refund-input-icon" />
                  <textarea
                    name="refund_reason"
                    placeholder="Optional note for this refund"
                    rows={3}
                    value={formData.refund_reason}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="refund-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="refund-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit Refund</span>
                )}
              </button>
            </form>

            {message && (
              <div className={`refund-status-msg ${isError ? "is-error" : "is-success"}`}>
                {isError ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
                <span>{message.replace(/^[✅⚠️❌]+\s*/u, "")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund History */}
      <RefundHistory adminId={user?.admin_id} refresh={refreshHistory} />
    </div>
  );
}
