import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./Events.css";
import EventsTable from "./EventsTable";
import EventDetails from "./EventDetails";
import EditEventModal from "./EventEditModel";
import CreateEventModal from "./CreateEventModal";

const sortOptions = [
  "Created Date (Newest First)",
  "Created Date (Oldest First)",
  "Start Date (Upcoming First)",
  "Start Date (Past First)",
  "End Date (Ending Soon)",
  "Display Order (Ascending)",
  "Display Order (Descending)",
  "Last Updated",
  "Active First",
  "Inactive First",
  "Event Type (A-Z)",
];

const eventTypeOptions = [
  "All Events",
  "Event",
  "Club",
  "Offer",
  "Announcement",
  "Advertisement",
  "News",
  "Information",
  "Others",
];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortType, setSortType] = useState(sortOptions[0]);
  const [locationFilter, setLocationFilter] = useState("All");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ✅ FETCH EVENTS
  useEffect(() => {
    fetch("https://admin-aged-field-2794.fly.dev/events/")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((event) => ({
          ...event,
          startDate: event.start_at,
          endDate: event.end_at,
          active: event.is_active,
          image: event.image_url,
        }));
        setEvents(formatted);
      })
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

  // ✅ UNIQUE LOCATIONS
  const uniqueLocations = useMemo(() => {
    const locations = events.map((e) => e.location);
    return ["All", ...new Set(locations)];
  }, [events]);

  // ✅ TIMELINE STATUS (FIXED — no dependency warning)
  const getTimeline = useCallback((event) => {
    const today = new Date(); // moved inside
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (today < start) return "Upcoming";
    if (today > end) return "Expired";
    return "Ongoing";
  }, []);

  const handleViewEvent = (id) => setSelectedEventId(id);

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditOpen(true);
  };

  const deleteEvent = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (!confirmDelete) return;

    try {
      await fetch(`https://admin-aged-field-2794.fly.dev/events/${id}`, {
        method: "DELETE",
      });

      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleCreateSuccess = (newEvent) => {
    const formatted = {
      ...newEvent,
      startDate: newEvent.start_at,
      endDate: newEvent.end_at,
      active: newEvent.is_active,
      image: newEvent.image_url,
    };

    setEvents((prev) => [formatted, ...prev]);
  };

  // ✅ FILTER + SORT
  const filteredData = useMemo(() => {
    let data = [...events];

    if (search) {
      data = data.filter(
        (e) =>
          e.title?.toLowerCase().includes(search.toLowerCase()) ||
          e.slug?.toLowerCase().includes(search.toLowerCase()) ||
          e.location?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (locationFilter !== "All") {
      data = data.filter((e) => e.location === locationFilter);
    }

    if (eventTypeFilter !== "All") {
      data = data.filter((e) => e.event_type === eventTypeFilter);
    }

    if (statusFilter !== "All") {
      data = data.filter((e) => {
        const timeline = getTimeline(e);

        if (statusFilter === "Active") return e.active;
        if (statusFilter === "Inactive") return !e.active;
        if (statusFilter === "Upcoming") return timeline === "Upcoming";
        if (statusFilter === "Ongoing") return timeline === "Ongoing";
        if (statusFilter === "Expired") return timeline === "Expired";
        return true;
      });
    }

    data.sort((a, b) => {
      switch (sortType) {
        case "Created Date (Newest First)":
          return new Date(b.created_at) - new Date(a.created_at);
        case "Created Date (Oldest First)":
          return new Date(a.created_at) - new Date(b.created_at);
        case "Start Date (Upcoming First)":
          return new Date(a.startDate) - new Date(b.startDate);
        case "Start Date (Past First)":
          return new Date(b.startDate) - new Date(a.startDate);
        case "End Date (Ending Soon)":
          return new Date(a.endDate) - new Date(b.endDate);
        case "Display Order (Ascending)":
          return a.display_order - b.display_order;
        case "Display Order (Descending)":
          return b.display_order - a.display_order;
        case "Last Updated":
          return new Date(b.updated_at) - new Date(a.updated_at);
        case "Active First":
          return b.active - a.active;
        case "Inactive First":
          return a.active - b.active;
        case "Event Type (A-Z)":
          return a.event_type.localeCompare(b.event_type);
        default:
          return 0;
      }
    });

    return data;
  }, [
    events,
    search,
    statusFilter,
    sortType,
    locationFilter,
    eventTypeFilter,
    getTimeline,
  ]);

  return (
    <div className="events-container">
      <div className="events-header">
        <div>
          <h1>Events</h1>
          <p>Manage promotional and live events</p>
        </div>

        <button className="create-btn" onClick={() => setIsCreateOpen(true)}>
          + Create Event
        </button>
      </div>

      <div className="events-controls">
        <input
          type="text"
          placeholder="Search by title, slug, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          {sortOptions.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          {uniqueLocations.map((loc, i) => (
            <option key={i} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
        >
          {eventTypeOptions.map((type, i) => (
            <option key={i} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-buttons">
        {["All", "Active", "Inactive", "Upcoming", "Ongoing", "Expired"].map(
          (btn) => (
            <button
              key={btn}
              className={statusFilter === btn ? "active-filter" : ""}
              onClick={() => setStatusFilter(btn)}
            >
              {btn}
            </button>
          )
        )}
      </div>

      <EventsTable
        filteredData={filteredData}
        getTimeline={getTimeline}
        deleteEvent={deleteEvent}
        onViewEvent={handleViewEvent}
        onEditEvent={handleEditEvent}
      />

      <EventDetails
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />

      {isEditOpen && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => setIsEditOpen(false)}
          onUpdateSuccess={() => window.location.reload()}
        />
      )}

      {isCreateOpen && (
        <CreateEventModal
          onClose={() => setIsCreateOpen(false)}
          onCreateSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Events;