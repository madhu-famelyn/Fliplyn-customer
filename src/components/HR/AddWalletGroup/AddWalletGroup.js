import React, { useState } from "react";
import "./AddWalletGroup.css";
import { uploadWalletGroupExcel } from "../../Service";

const CreateWalletGroupModal = ({ onClose, hr, token, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [carryForward, setCarryForward] = useState(false);
  const [excludeWeekend, setExcludeWeekend] = useState(false);
  const [dailyWallet, setDailyWallet] = useState(false);
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
    formData.append("carry_forward", carryForward);
    formData.append("exclude_weekend", excludeWeekend);
    formData.append("daily_wallet", dailyWallet);
    formData.append("days_count", 1);
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await uploadWalletGroupExcel(formData, token); // ✅ use service
      alert(res.data.message);

      if (onGroupCreated) {
        onGroupCreated({
          id: crypto.randomUUID(),
          group_name: groupName,
          users: [],
        });
      }
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create group");
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
