// src/pages/token/EnterTokenPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PrintToken.css"; // will contain the styles
import TokenHeader from "./Header";

export default function EnterTokenPage() {
  const [tokenNumber, setTokenNumber] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tokenNumber) return;
    navigate(`/print-token/${tokenNumber}`);
  };

  return (
    <div> <TokenHeader/>
    <div className="token-container">
       
      <div className="token-card">
        <h2 className="token-title">Enter Your Token Number</h2>
        <p className="token-subtitle">
          Provide your order token to view and print your receipt.
        </p>

        <form onSubmit={handleSubmit} className="token-form">
          <label htmlFor="tokenInput" className="token-label">
            Token Number
          </label>
          <input
  id="tokenInput"
  type="text"   // ✅ changed from "number" to "text"
  placeholder="Enter token number"
  value={tokenNumber}
  onChange={(e) => setTokenNumber(e.target.value)}
  className="token-input"
/>

          <button type="submit" id="fetchBtn" className="token-button">
            Fetch Order Details
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
