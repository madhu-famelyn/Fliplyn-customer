import React, { useState, useEffect } from "react";
import "./EventEditModel.css";
import { FaTimes } from "react-icons/fa";

const EditEventModal = ({ event, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    redirect_url: "",
    start_at: "",
    end_at: "",
    is_active: false,
    display_order: 0,
    event_type: "Event",
  });

  const [imageFile, setImageFile] = useState(null);

  const eventTypes = [
    "Event",
    "Club",
    "Offer",
    "Announcement",
    "Advertisement",
    "News",
    "Information",
    "Others",
  ];

  // Convert ISO date to datetime-local format
  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        redirect_url: event.redirect_url || "",
        start_at: formatDateTimeLocal(event.start_at),
        end_at: formatDateTimeLocal(event.end_at),
        is_active: event.is_active ?? false,
        display_order: event.display_order ?? 0,
        event_type: event.event_type || "Event",
      });
    }
  }, [event]);

  if (!event) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key]);
      }
    });

    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      const res = await fetch(
        `https://admin-aged-field-2794.fly.dev/events/${event.id}`,
        {
          method: "PUT",
          body: data,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        alert(err.detail || "Failed to update event");
        return;
      }

      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="edit-event-overlay" onClick={onClose}>
      <div
        className="edit-event-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="edit-event-close-btn"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        <h2 className="edit-event-title">Edit Event</h2>

        <div className="edit-event-form-grid">
          {/* Title */}
          <input
            className="edit-event-input"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Title"
          />

          {/* Event Type Dropdown */}
          <select
            className="edit-event-input"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Location */}
          <input
            className="edit-event-input"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
          />

          {/* Redirect URL */}
          <input
            className="edit-event-input"
            name="redirect_url"
            value={formData.redirect_url}
            onChange={handleChange}
            placeholder="Redirect URL"
          />

          {/* Start Date */}
          <input
            className="edit-event-input"
            type="datetime-local"
            name="start_at"
            value={formData.start_at}
            onChange={handleChange}
          />

          {/* End Date */}
          <input
            className="edit-event-input"
            type="datetime-local"
            name="end_at"
            value={formData.end_at}
            onChange={handleChange}
          />

          {/* Display Order */}
          <input
            className="edit-event-input"
            type="number"
            name="display_order"
            value={formData.display_order}
            onChange={handleChange}
            placeholder="Display Order"
          />

          {/* Active Checkbox */}
          <label className="edit-event-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>

          {/* Image Upload */}
          <input
            className="edit-event-file-input"
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {/* Description */}
          <textarea
            className="edit-event-textarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
          />
        </div>

        <button
          className="edit-event-save-btn"
          onClick={handleSubmit}
        >
          Update Event
        </button>
      </div>
    </div>
  );
};

export default EditEventModal;
