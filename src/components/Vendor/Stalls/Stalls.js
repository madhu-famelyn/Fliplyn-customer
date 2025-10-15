// src/pages/vendor/VendorStalls.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useVendorAuth } from "../../AuthContex/VendorContext";  // ✅ use the hook
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import { useNavigate } from "react-router-dom";
import "./Stalls.css";

const VendorStalls = () => {
  const { stallIds, token, setStallId } = useVendorAuth(); // ✅ correct
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
        const promises = stallIds.map((id) =>
          axios.get(`https://admin-aged-field-2794.fly.dev/stalls/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const results = await Promise.all(promises);
        setStalls(results.map((res) => res.data));
      } catch (error) {
        console.error("❌ Error fetching stalls:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, [stallIds, token]);

  const handleSelectStall = (id) => {
    if (setStallId) setStallId(id); // ✅ optional but safe
    navigate(`/items-vendor/${id}`);
  };

  if (loading) return <p>Loading stalls...</p>;
  if (!stalls || stalls.length === 0) return <p>No stalls found.</p>;

  return (
    <div>
      <TokenHeader />
      <div className="stalls-container">
        {stalls.map((stall) => (
          <div
            key={stall.id}
            className="stall-card-simple"
            onClick={() => handleSelectStall(stall.id)}
          >
            <img
              src={stall.image_url || "https://via.placeholder.com/150"}
              alt={stall.name}
              className="stall-image-simple"
            />
            <p className="stall-text">Select {stall.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorStalls;
