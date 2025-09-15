import React, { useState } from "react";
import { getWalletGroupsByHrId, uploadWalletGroupExcel1}from "../../Service";
import "./EmployeDetails.css";

const UpdateExcelModal = ({ groupId, token, hrId, onClose, onGroupUpdated }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return setError("Please select an Excel file");
    setLoading(true);
    setError("");

    try {
      // ✅ Upload Excel using service
      await uploadWalletGroupExcel1(groupId, file, token);

      // ✅ Refetch wallet groups after successful upload
      if (hrId) {
        const groups = await getWalletGroupsByHrId(hrId, token);
        const updatedGroup = groups.find((g) => g.id === groupId);
        if (onGroupUpdated && updatedGroup) onGroupUpdated(updatedGroup);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Error uploading Excel file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Update Wallet Group via Excel</h3>
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-buttons">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateExcelModal;
