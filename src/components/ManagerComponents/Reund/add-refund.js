import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import RefundHistory from "./RefundHistory";
import "./AddRefund.css";

export default function RefundModal() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    token_number: "",
    refund_amount: "",
    refund_reason: "",
    user_email: "",
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
      setMessage("Admin ID missing from context.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      admin_id: user.admin_id,
      manager_id: user?.id || null, // optional if available
      token_number: formData.token_number,
      refund_amount: Number(formData.refund_amount),
      refund_reason: formData.refund_reason,
      user_email: formData.user_email,
    };

    try {
      const response = await axios.post(
        "https://admin-aged-field-2794.fly.dev/refunds/",
        payload
      );

      if (response.data) {
        setMessage("✅ Refund processed successfully!");
        setFormData({
          token_number: "",
          refund_amount: "",
          refund_reason: "",
          user_email: "",
        });
        setRefreshHistory((prev) => !prev);
      } else {
        setMessage("⚠️ Refund request sent but backend did not confirm success.");
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.detail ||
          "❌ Something went wrong while processing refund"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refund-wrapper">
      {/* Open Button */}
      <button className="refund-open-btn" onClick={() => setIsOpen(true)}>
        + Add Refund
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="refund-modal-overlay">
          <div className="refund-modal">
            <div className="refund-modal-header">
              <h2>Add Refund</h2>
              <button
                className="refund-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="refund-form">
              <label>Token Number</label>
              <input
                type="text"
                name="token_number"
                value={formData.token_number}
                onChange={handleChange}
                required
              />

              <label>Refund Amount</label>
              <input
                type="number"
                name="refund_amount"
                value={formData.refund_amount}
                onChange={handleChange}
                required
              />

              <label>Refund Reason</label>
              <textarea
                name="refund_reason"
                value={formData.refund_reason}
                onChange={handleChange}
                required
              />

              <label>User Email</label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                required
              />

              <button
                type="submit"
                className="refund-submit-btn"
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit Refund"}
              </button>
            </form>

            {message && <p className="refund-status-msg">{message}</p>}
          </div>
        </div>
      )}

      {/* Refund History */}
      <RefundHistory adminId={user?.admin_id} refresh={refreshHistory} />
    </div>
  );
}
