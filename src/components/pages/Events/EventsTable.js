import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import DeleteConfirmModal from "./DeleteConfirmModel";

const EventsTable = ({
  filteredData,
  getTimeline,
  deleteEvent,
  onViewEvent,
  onEditEvent,
}) => {

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

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

  const handleDeleteClick = (eventId) => {
    setSelectedEventId(eventId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEventId) return;

    await deleteEvent(selectedEventId);

    setDeleteOpen(false);
    setSelectedEventId(null);
  };

  return (
    <>
      <div className="events-table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Type</th> {/* ✅ NEW COLUMN */}
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Timeline</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((event) => (
              <tr
                key={event.id}
                onClick={() => onViewEvent(event.id)}
              >
                <td>
                  <img
                    src={event.image}
                    alt={event.title}
                    className="event-image"
                  />
                </td>

                <td>{event.title}</td>

                {/* ✅ SHOW EVENT TYPE */}
                <td>
                  <span className="event-type-badge">
                    {event.type}
                  </span>
                </td>

                <td>{formatDateTime(event.startDate)}</td>
                <td>{formatDateTime(event.endDate)}</td>

                <td>
                  <span className={event.active ? "status-active" : "status-inactive"}>
                    {event.active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <span className="timeline-badge">
                    {getTimeline(event)}
                  </span>
                </td>

                <td
                  className="actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEditEvent(event)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDeleteClick(event.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </>
  );
};

export default EventsTable;
