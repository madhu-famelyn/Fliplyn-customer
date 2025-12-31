import React, { useEffect, useState } from "react";
import axios from "axios";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import { useNavigate } from "react-router-dom";
import "./Stalls.css";

const VendorStalls = () => {
  const { stallIds, token } = useVendorAuth(); // ❌ removed setStallId
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!stallIds || stallIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStalls = async () => {
      try {
        const requests = stallIds.map((id) =>
          axios.get(`https://admin-aged-field-2794.fly.dev/stalls/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const responses = await Promise.all(requests);
        setStalls(responses.map((res) => res.data));
      } catch (err) {
        console.error("❌ Failed to fetch stalls", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, [stallIds, token]);

  const handleManageItems = (id) => {
    navigate(`/items-vendor/${id}`); // ✅ ID passed via route
  };

  if (loading) return <p className="loading-text">Loading outlets...</p>;
  if (!stalls.length) return <p className="loading-text">No outlets found.</p>;

  return (
    <div className="vendor-page">
      <TokenHeader />

      <div className="page-header">
        <h1>My Outlets</h1>
        <p>Select an outlet to manage items and update availability.</p>
      </div>

      <div className="outlets-grid">
        {stalls.map((stall) => (
          <div key={stall.id} className="outlet-card">
            <img
              src={stall.image_url || "https://via.placeholder.com/300"}
              alt={stall.name}
              className="outlet-image"
            />

            <div className="outlet-content">
              <h3>{stall.name}</h3>
              <p className="outlet-desc">{stall.description}</p>

              <div className="bottom-row">
                <div className="time-column">
                  <span className="open-time">
                    ⏰ Opens at {stall.opening_time}
                  </span>
                  <span className="close-time">
                    🔴 Closes at {stall.closing_time}
                  </span>
                </div>

                <button
                  className="manage-btn"
                  onClick={() => handleManageItems(stall.id)}
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorStalls;
