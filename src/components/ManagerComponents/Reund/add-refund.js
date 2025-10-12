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

    if (!user?.id || !user?.admin_id) {
      setMessage("Manager/Admin ID missing from context.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      manager_id: user.id,
      admin_id: user.admin_id,
      token_number: formData.token_number,
      refund_amount: Number(formData.refund_amount),
      refund_reason: formData.refund_reason,
      // user_email removed; backend fetches it automatically
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
        });
        setRefreshHistory((prev) => !prev);
      } else {
        setMessage(
          "⚠️ Refund request sent but backend did not confirm success."
        );
      }
    } catch (err) {
      console.error(err);
      let errorMsg = "❌ Something went wrong while processing refund";

      // Handle object/array from FastAPI/Pydantic validation errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // take the first message or join all
          errorMsg = err.response.data.detail
            .map((d) => d.msg || JSON.stringify(d))
            .join(", ");
        } else if (typeof err.response.data.detail === "object") {
          errorMsg = JSON.stringify(err.response.data.detail);
        } else {
          errorMsg = err.response.data.detail;
        }
      }

      setMessage(errorMsg);
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
        <div className="refund-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="refund-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
      <RefundHistory managerId={user?.id} refresh={refreshHistory} />
    </div>
  );
}
