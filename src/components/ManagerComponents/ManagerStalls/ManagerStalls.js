import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import "./ManagerStalls.css"; // CSS file

export default function ManagerStallIds() {
  const { user } = useAuth(); // get building_id from auth context
  const [stallData, setStallData] = useState([]); // store full stall info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStalls = async () => {
      if (!user?.building_id) {
        setError("Building ID not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
        );
        setStallData(response.data); // full data including images
      } catch (err) {
        console.error(err);
        setError("Failed to fetch stalls.");
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, [user]);

  if (loading) return <p>Loading stalls...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="ms-wrapper">
      <h2 className="ms-heading">Select Outlet</h2>

      <div className="ms-buttons">
        <button
          className="ms-btn"
          onClick={() => navigate("/add-refund")}
        >
          Add Refund
        </button>
        <button
          className="ms-btn"
          onClick={() => navigate("/view-sales")}
        >
          View Sales
        </button>
        <button
          className="ms-btn"
          onClick={() => navigate("/add-stall")}
        >
          Add Stall
        </button>
        <button
          className="ms-btn"
          onClick={() => navigate("/place-bulk-order")}
        >
          Place Bulk Order
        </button>
      </div>

      <div className="ms-grid">
        {stallData.map((stall) => (
          <div
            key={stall.id}
            className="ms-card"
            onClick={() => navigate(`/item/${stall.id}`)}
          >
            <img
              src={stall.image_url}
              alt={stall.name}
              className="ms-image"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
