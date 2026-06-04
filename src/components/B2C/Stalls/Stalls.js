import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Stalls.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { useNavigate } from "react-router-dom";
import { useB2CAuth } from "../../AuthContex/B2CContext";

const API_BASE =
  window.location.hostname === "localhost"
    ? `http://${window.location.hostname}:8000`
    : "https://admin-aged-field-2794.fly.dev";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-text" />
    </div>
  );
}

export default function B2CStalls() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { b2cUser, token } = useB2CAuth();
  const userId = b2cUser?.id;

  const [buildingId, setBuildingId] = useState(
    localStorage.getItem("b2c_selectedBuildingId")
  );

  useEffect(() => {
    const fetchBuildingAndStalls = async () => {
      if (!userId || !token) {
        console.warn("⚠️ B2C User or token not available yet");
        return;
      }

      try {
        let finalBuildingId = buildingId;

        // ------------------ STEP 1: GET BUILDING ID ------------------
        if (!finalBuildingId) {
          console.log("🔍 Fetching buildingId using userId...");

          const userRes = await axios.get(
            `${API_BASE}/user/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          finalBuildingId = userRes.data?.building_id;

          if (finalBuildingId) {
            localStorage.setItem("b2c_selectedBuildingId", finalBuildingId);
            setBuildingId(finalBuildingId);
          }
        }

        if (!finalBuildingId) {
          console.warn("⚠️ No buildingId found, continuing without redirect");
          setLoading(false);
          return;
        }

        // ------------------ FETCH STALLS ------------------
        console.log("🔄 Fetching fresh stalls from API...");

        const res = await axios.get(
          `${API_BASE}/stalls/building/${finalBuildingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let fetched = res.data || [];
        setStalls(fetched);
      } catch (err) {
        console.error("❌ Stall fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingAndStalls();
  }, [buildingId, userId, token]);

  // ------------------ CLICK HANDLER ------------------
  const handleStallClick = (stallId) => {
    navigate(`/b2c/categories/${stallId}`);
  };

  // ------------------ SEARCH FILTER & ACTIVE SORT ------------------
  const filteredStalls = stalls
    .filter((stall) =>
      stall.name?.toLowerCase().includes(search.toLowerCase()) && stall.is_available
    )
    .sort((a, b) => {
      if (a.is_available && !b.is_available) return -1;
      if (!a.is_available && b.is_available) return 1;
      return 0;
    });

  return (
    <>
      <Header />

      <div className="stalls-page-container">
        {/* Hero Header */}
        <div className="top-section">
          <div className="hero-badge">
            <span></span>
            {loading ? "Fetching outlets" : `${filteredStalls.length} Outlets`}
          </div>

          <h1 className="page-title">Explore Outlets</h1>
          <p className="page-subtitle">
            Browse menus and order your favorite meals.
          </p>

          <div className="search-bar-container">
            <input
              id="stall-search"
              type="text"
              placeholder="Search stalls..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="bottom-section">
            <div className="stalls-skeleton-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : filteredStalls.length === 0 ? (
          <p className="no-stalls">
            {search
              ? "No stalls match your search."
              : "No stalls available in this building."}
          </p>
        ) : (
          <div className="bottom-section">
            <div className="stalls-grid">
              {filteredStalls.map((stall) => (
                <div
                  className={`stall-card ${!stall.is_available ? "unavailable" : ""}`}
                  key={stall.id}
                  onClick={() => stall.is_available && handleStallClick(stall.id)}
                >
                  {/* Image wrapper with shine + open badge */}
                  <div className="stall-image-wrapper">
                    <img
                      src={stall.image_url}
                      alt={stall.name}
                      className="stall-image"
                      loading="lazy"
                    />

                    {!stall.is_available && (
                      <div className="unavailable-overlay">
                        <p>Closed</p>
                      </div>
                    )}
                  </div>

                  <p className="stall-names">{stall.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
