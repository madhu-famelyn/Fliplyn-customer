// src/components/Popup.js
import React from 'react';

export default function Popup({ children, onClose }) {
  return (
    <div
      className="popup-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="popup-form"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90%',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
