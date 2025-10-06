// src/components/CreateWalletGroupModal.js
import React, { useState } from "react";
import "./AddWalletGroup.css";
import { uploadWalletGroupExcel } from "../../Service";


const CreateWalletGroupModal = ({ onClose, hr, token, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [carryForward, setCarryForward] = useState(false);
  const [excludeWeekend, setExcludeWeekend] = useState(false);
  const [dailyWallet, setDailyWallet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PREPAID");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("building_id", hr.building_id);
    formData.append("admin_id", hr.admin_id);
    formData.append("hr_id", hr.id);
    formData.append("group_name", groupName);
    formData.append("wallet_amount", walletAmount);
    formData.append("carry_forward", String(carryForward)); // ✅ string form
    formData.append("exclude_weekend", String(excludeWeekend));
    formData.append("daily_wallet", String(dailyWallet));
    formData.append("days_count", "1");
    formData.append("payment_method", paymentMethod);
    formData.append("file", file);

    // ✅ Log the data before sending
    console.log("📤 Submitting Wallet Group Data:", {
      building_id: hr.building_id,
      admin_id: hr.admin_id,
      hr_id: hr.id,
      group_name: groupName,
      wallet_amount: walletAmount,
      carry_forward: carryForward,
      exclude_weekend: excludeWeekend,
      daily_wallet: dailyWallet,
      days_count: 1,
      payment_method: paymentMethod,
      file: file?.name,
    });

    try {
      setLoading(true);
      const res = await uploadWalletGroupExcel(formData, token);

      console.log("✅ Response from backend:", res.data);
      alert(res.data.message || "Group created successfully!");

      if (onGroupCreated) {
        onGroupCreated({
          id: crypto.randomUUID(),
          group_name: groupName,
          users: [],
        });
      }
      onClose();
    } catch (err) {
      console.error("❌ Error creating wallet group:", err);

      if (err.response) {
        console.error("🔴 Backend error:", err.response.data);
        alert(err.response.data.detail || "Backend error occurred.");
      } else if (err.request) {
        console.error("⚠️ No response from server:", err.request);
        alert("No response from server. Please try again.");
      } else {
        console.error("⚡ Request setup error:", err.message);
        alert("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Create Wallet Group</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Wallet Amount"
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            required
          />

          <label>
            <input
              type="checkbox"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
            />
            Carry Forward
          </label>
          <label>
            <input
              type="checkbox"
              checked={excludeWeekend}
              onChange={(e) => setExcludeWeekend(e.target.checked)}
            />
            Exclude Weekend
          </label>
          <label>
            <input
              type="checkbox"
              checked={dailyWallet}
              onChange={(e) => setDailyWallet(e.target.checked)}
            />
            Daily Wallet
          </label>

          <label>
            Payment Method:
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value="PREPAID">Prepaid</option>
              <option value="POSTPAID">Postpaid</option>
            </select>
          </label>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />

          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWalletGroupModal;
