import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // For Excel export

const UpdateGroupModal = ({ groupId, onClose, onUpdated, token }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [nonRegisteredUsers, setNonRegisteredUsers] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const downloadNonRegisteredUsers = () => {
    if (!nonRegisteredUsers.length) return;

    const ws = XLSX.utils.json_to_sheet(nonRegisteredUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Non-Registered Users");
    XLSX.writeFile(wb, "non_registered_users.xlsx");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessageType("error");
      setMessage("❌ Please choose a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");
    setMessageType("");
    setNonRegisteredUsers([]); // Reset

    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/wallet-groups/${groupId}/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessageType("success");
      setMessage("✅ File uploaded successfully.");

      if (res.data?.non_registered_users?.length) {
        console.log("📜 Non-registered users:", res.data.non_registered_users);
        setNonRegisteredUsers(res.data.non_registered_users);
      }

      onUpdated();
    } catch (error) {
      console.error("Upload failed:", error);

      let errorMsg = "❌ Upload failed. Please try again.";
      if (error.response?.data?.detail) {
        errorMsg = `❌ ${error.response.data.detail}`;
      }
      setMessageType("error");
      setMessage(errorMsg);

      if (error.response?.data?.non_registered_users?.length) {
        console.log(
          "📜 Non-registered users (from error):",
          error.response.data.non_registered_users
        );
        setNonRegisteredUsers(error.response.data.non_registered_users);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyle.overlay}>
      <div style={modalStyle.modal}>
        <h3>Reupload Excel for Group</h3>

        <form onSubmit={handleSubmit}>
          <div style={modalStyle.formGroup}>
            <label>Upload Excel File:</label>
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              required
            />
          </div>

          {message && (
            <p
              style={{
                ...modalStyle.message,
                color: messageType === "error" ? "#cc0000" : "#008000",
              }}
            >
              {message}
            </p>
          )}

          {nonRegisteredUsers.length > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <p style={{ fontWeight: "bold", color: "#cc0000" }}>
                ⚠ {nonRegisteredUsers.length} non-registered users found.
              </p>
              <button
                type="button"
                onClick={downloadNonRegisteredUsers}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Download Non-Registered Users
              </button>
            </div>
          )}

          <div style={modalStyle.buttons}>
            <button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const modalStyle = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    width: "400px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  formGroup: {
    marginBottom: "15px",
  },
  message: {
    marginBottom: "10px",
    fontWeight: "bold",
  },
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
  },
};

export default UpdateGroupModal;
