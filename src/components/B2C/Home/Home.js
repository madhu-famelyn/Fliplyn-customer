import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// ─── Media Slides Configuration ───────────────────────────────────────────────
// Add your image URLs or video URLs here.
// type: "image" | "video"
// For videos: use a direct .mp4 link or a local file from public folder
const SLIDES = [
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    caption: "Juicy Burgers",
    sub: "Fresh, hot & made to order",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    caption: "Wood-fired Pizza",
    sub: "Crispy crust, loaded toppings",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    caption: "Fried Rice",
    sub: "Asian flavours, every bite",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    caption: "Samosa",
    sub: "Steamed to perfection",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
    caption: "Creamy Milkshakes",
    sub: "Thick, rich & indulgent",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80",
    caption: "Crispy Sandwiches",
    sub: "Stacked with goodness",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    caption: "Fluffy Pancakes",
    sub: "Golden, soft & sweet",
  },
];


const SLIDE_DURATION = 4000; // ms per slide

export default function B2CHome() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const videoRefs = useRef({});

  // ── Auto-advance slides ──────────────────────────────────────────────────
  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
      setIsTransitioning(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(goToNext, SLIDE_DURATION);
    return () => clearInterval(timerRef.current);
  }, [isPaused, goToNext]);

  // Auto-play video when active
  useEffect(() => {
    const slide = SLIDES[currentIndex];
    if (slide.type === "video") {
      const vid = videoRefs.current[currentIndex];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => { });
      }
    }
  }, [currentIndex]);

  // ── Manual dot navigation ────────────────────────────────────────────────
  const goToSlide = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
    // Reset timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(goToNext, SLIDE_DURATION);
  };

  const handleOrderClick = () => {
    navigate("/b2c/stalls");
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <div className="b2c-home-wrapper">
      {/* ── Background media layer ────────────────────────────────────── */}
      <div className={`b2c-media-layer ${isTransitioning ? "fading" : ""}`}>
        {currentSlide.type === "image" ? (
          <img
            src={currentSlide.src}
            alt={currentSlide.caption}
            className="b2c-media-bg"
            draggable={false}
          />
        ) : (
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentSlide.src}
            className="b2c-media-bg"
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        {/* Dark gradient overlay */}
        <div className="b2c-overlay" />
      </div>



      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="b2c-home-content">

        {/* CTA card — like the kiosk image */}
        <div className="b2c-cta-card" onClick={handleOrderClick}>
          <div className="b2c-cta-left">
            <p className="b2c-cta-text">Order &amp;</p>
            <p className="b2c-cta-text">Pay here</p>
          </div>
          <div className="b2c-cta-right">
            {/* UPI badge */}
            <div className="b2c-upi-badge">
              <span className="upi-text">UPI</span>
              <span className="upi-arrow">▶</span>
            </div>
            {/* Tap hand icon */}
            <div className="b2c-tap-icon">
              <svg
                viewBox="0 0 64 64"
                width="52"
                height="52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Palm */}
                <path
                  d="M28 44V24a3 3 0 016 0v12"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M34 32a3 3 0 016 0v8"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M22 34a3 3 0 016 0v10"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M16 38a3 3 0 016 0v6c0 6 5 11 11 11h2c5 0 10-4 10-11v-6"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Tap rings */}
                <circle
                  cx="32"
                  cy="16"
                  r="4"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <circle
                  cx="32"
                  cy="16"
                  r="8"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          {/* Ripple animation on tap */}
          <div className="b2c-ripple" />
        </div>

        {/* Slide progress bar */}
        <div className="b2c-progress-bar">
          <div
            className="b2c-progress-fill"
            style={{
              animationDuration: `${SLIDE_DURATION}ms`,
              animationPlayState: isPaused ? "paused" : "running",
              animationName: "progress-fill",
            }}
            key={currentIndex} /* Restart animation on slide change */
          />
        </div>
      </div>
    </div>
  );
}
