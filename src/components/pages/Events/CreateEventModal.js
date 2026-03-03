import React, { useState } from "react";
import "./EventEditModel.css";
import { FaTimes } from "react-icons/fa";

const CreateEventModal = ({ onClose, onCreateSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    redirect_url: "",
    start_at: "",
    end_at: "",
    is_active: true,
    display_order: 0,
    event_type: "Event", // ✅ default type
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      alert("Please upload an image");
      return;
    }

    if (!formData.start_at || !formData.end_at) {
      alert("Please select start and end date");
      return;
    }

    setLoading(true);

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    data.append("image", imageFile);

    try {
      const res = await fetch("https://admin-aged-field-2794.fly.dev/events/", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        alert(err.detail || "Failed to create event");
        setLoading(false);
        return;
      }

      const createdEvent = await res.json();

      onCreateSuccess(createdEvent);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="edit-event-overlay" onClick={onClose}>
      <div
        className="edit-event-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="edit-event-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2 className="edit-event-title">Create Event</h2>

        <div className="edit-event-form-grid">
          {/* Title */}
          <input
            className="edit-event-input"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
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
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          {/* Redirect URL */}
          <input
            className="edit-event-input"
            name="redirect_url"
            placeholder="Redirect URL"
            value={formData.redirect_url}
            onChange={handleChange}
          />

          {/* Start Date */}
          <input
            type="datetime-local"
            className="edit-event-input"
            name="start_at"
            value={formData.start_at}
            onChange={handleChange}
          />

          {/* End Date */}
          <input
            type="datetime-local"
            className="edit-event-input"
            name="end_at"
            value={formData.end_at}
            onChange={handleChange}
          />

          {/* Display Order */}
          <input
            type="number"
            className="edit-event-input"
            name="display_order"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={handleChange}
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
            type="file"
            className="edit-event-file-input"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {/* Description */}
          <textarea
            className="edit-event-textarea"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <button
          className="edit-event-save-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </div>
    </div>
  );
};

export default CreateEventModal;
