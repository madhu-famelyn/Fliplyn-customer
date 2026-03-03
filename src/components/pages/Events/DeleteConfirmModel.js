import React from "react";
import "./DeleteConfirmModel.css";
import { FaExclamationTriangle } from "react-icons/fa";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div
        className="delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-icon">
          <FaExclamationTriangle />
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="delete-actions">
          <button
            className="delete-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="delete-confirm"
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
