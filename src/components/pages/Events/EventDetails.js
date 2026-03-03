import React, { useEffect, useState } from "react";
import "./EventDetails.css";
import { FaTimes } from "react-icons/fa";

const EventDetails = ({ eventId, onClose }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Event Details
  useEffect(() => {
    if (!eventId) return;

    setLoading(true);

    fetch(`https://admin-aged-field-2794.fly.dev/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  // Prevent background scroll when drawer open
  useEffect(() => {
    if (eventId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [eventId]);

  if (!eventId) return null;

  // Format Date
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Timeline Status
  const getTimeline = () => {
    if (!event) return "";

    const today = new Date();
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);

    if (today < start) return "Upcoming";
    if (today > end) return "Expired";
    return "Ongoing";
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="drawer-header">
          <h2>Event Details</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <p className="loading-text">Loading event details...</p>
        ) : !event ? (
          <p className="loading-text">No event found.</p>
        ) : (
          <>
            <img
              src={event.image_url}
              alt={event.title}
              className="drawer-image"
            />

            <h3 className="event-title">{event.title}</h3>
            <p className="description">{event.description}</p>

            <div className="detail-row">
              <span>Location</span>
              <strong>{event.location}</strong>
            </div>

            <div className="detail-row">
              <span>Start</span>
              <strong>{formatDateTime(event.start_at)}</strong>
            </div>

            <div className="detail-row">
              <span>End</span>
              <strong>{formatDateTime(event.end_at)}</strong>
            </div>

            <div className="detail-row">
              <span>Display Order</span>
              <strong>{event.display_order}</strong>
            </div>

            <div className="detail-row">
              <span>Status</span>
              <div className="badges">
                <span
                  className={
                    event.is_active
                      ? "status-badge active"
                      : "status-badge inactive"
                  }
                >
                  {event.is_active ? "Active" : "Inactive"}
                </span>

                <span className="timeline-badge">
                  {getTimeline()}
                </span>
              </div>
            </div>

            <div className="detail-row">
              <span>Redirect URL</span>
              <a
                href={event.redirect_url}
                target="_blank"
                rel="noreferrer"
                className="visit-link"
              >
                Visit
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
