import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import RefundHistory from "./RefundHistory"; // import refund history component
import "./AddRefund.css";

export default function RefundModal() {
  const { user } = useAuth(); // contains manager_id, admin_id etc.

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    token_number: "",
    refund_amount: "",
    refund_reason: "",
    user_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshHistory, setRefreshHistory] = useState(false); // trigger history refresh

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
      user_email: formData.user_email,
    };

    try {
      const response = await axios.post("https://fliplyn.onrender.com/refunds/", payload);

      if (response.data) {
        setMessage("✅ Refund processed successfully!");
        setFormData({
          token_number: "",
          refund_amount: "",
          refund_reason: "",
          user_email: "",
        });
        setRefreshHistory((prev) => !prev); // refresh refund history
      } else {
        setMessage("⚠️ Refund request sent but backend did not confirm success.");
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.detail || "❌ Something went wrong while processing refund"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Open Button */}
      <button className="open-btn" onClick={() => setIsOpen(true)}>
        Open Refund
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Refund</h2>
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

              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Submit Refund"}
                </button>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsOpen(false)}
                >
                  X
                </button>
              </div>
            </form>

            {message && <p className="refund-message">{message}</p>}
          </div>
        </div>
      )}

      {/* Refund History */}
      <RefundHistory managerId={user?.id} refresh={refreshHistory} />
    </div>
  );
}
