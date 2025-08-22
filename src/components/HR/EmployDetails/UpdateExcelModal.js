import React, { useState } from "react";
import axios from "axios";
import { getWalletGroupsByHrId } from "../Dashboard/Service";
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload Excel
      await axios.put(
        `http://localhost:8000/wallet-groups/${groupId}/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refetch wallet groups after successful upload
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
