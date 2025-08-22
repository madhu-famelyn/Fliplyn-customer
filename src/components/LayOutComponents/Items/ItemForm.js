import React, { useState } from 'react';

const ItemForm = ({
  formData,
  file,
  handleChange,
  handleSubmit,
  setFile,
  message,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    // Set is_available to true before submit
    handleChange({
      target: {
        name: 'is_available',
        value: true,
      },
    });

    await handleSubmit(e);
    setSubmitting(false);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="item-form">
        <input
          type="text"
          name="name"
          className="small-input"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* 🔽 BIG DESCRIPTION TEXTAREA */}
        <textarea
          name="description"
          className="large-textarea"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <input
          type="number"
          name="price"
          className="small-input"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="Gst_precentage"
          className="small-input"
          placeholder="Tax %"
          value={formData.Gst_precentage}
          onChange={handleChange}
          disabled={formData.tax_included}
        />
        {formData.tax_included && (
          <small style={{ color: 'gray' }}>
            GST disabled because tax is included in price.
          </small>
        )}

        {/* ✅ Tax Included toggle */}
        <div className="toggle-group">
          <label>Tax Included</label>
          <label className="switch">
            <input
              type="checkbox"
              name="tax_included"
              checked={formData.tax_included}
              onChange={handleChange}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* ✅ Non-Veg toggle (inverted logic) */}
        <div className="toggle-group">
          <label>Is Non-Veg</label>
          <label className="switch">
            <input
              type="checkbox"
              name="is_veg"
              checked={!formData.is_veg} // checked means it's non-veg (is_veg = false)
              onChange={(e) =>
                handleChange({
                  ...e,
                  target: {
                    ...e.target,
                    name: 'is_veg',
                    value: !e.target.checked ? true : false,
                  },
                })
              }
            />
            <span className="slider round"></span>
          </label>
        </div>

        <input
          type="file"
          className="small-input"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

        <button type="submit" disabled={submitting} className="submit-btn">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {message && <p className="item-message">{message}</p>}
    </>
  );
};

export default ItemForm;
