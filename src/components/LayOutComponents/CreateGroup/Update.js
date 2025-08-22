// src/pages/Group/UpdateGroupModal.js
import React from "react";

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const contentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "300px",
  textAlign: "center",
};

const UpdateGroupModal = ({ onClose }) => {
  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h3>Hello</h3>
        <p>This is a placeholder popup.</p>
        <button
          onClick={onClose}
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#007d80",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UpdateGroupModal;
