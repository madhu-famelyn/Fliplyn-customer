// src/pages/stalls/StallForm.js
import React from 'react';

export default function StallForm({
  form,
  buildings,
  editMode,
  loading,
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="stall-form" onSubmit={onSubmit}>
      {/* Stall Name */}
      <input
        type="text"
        name="name"
        placeholder="Stall Name"
        value={form.name}
        onChange={onChange}
        required
      />

      {/* Description */}
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={onChange}
        required
      />

      {/* Building */}
      <select
        name="building_id"
        value={form.building_id}
        onChange={onChange}
        required
      >
        <option value="">-- Select Building --</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.building_name || b.name || 'Unnamed'}
          </option>
        ))}
      </select>

      {/* Opening Time */}
      <input
        type="text"
        name="opening_time"
        placeholder="Opening Time (e.g. 09:00 AM)"
        value={form.opening_time}
        onChange={onChange}
        required
      />

      {/* Closing Time */}
      <input
        type="text"
        name="closing_time"
        placeholder="Closing Time (e.g. 10:00 PM)"
        value={form.closing_time}
        onChange={onChange}
        required
      />

      {/* Availability */}
      <select
        name="is_available"
        value={form.is_available}
        onChange={onChange}
        required
      >
        <option value={true}>Available</option>
        <option value={false}>Not Available</option>
      </select>

      {/* Stall Image */}
      <input type="file" accept="image/*" onChange={onFileChange} />

      {/* Form Actions */}
      <div className="form-buttons" style={{ marginTop: '10px' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading
            ? editMode
              ? 'Updating...'
              : 'Creating...'
            : editMode
            ? 'Update Stall'
            : 'Create Stall'}
        </button>
      </div>
    </form>
  );
}
