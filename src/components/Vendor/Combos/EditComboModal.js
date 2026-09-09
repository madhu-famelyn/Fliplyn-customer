import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./EditComboModal.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://admin-aged-field-2794.fly.dev";

const EditComboModal = ({ combo, stallId, token, stallItems, onClose, onComboUpdated }) => {
  const [name, setName] = useState(combo?.name || "");
  const [description, setDescription] = useState(combo?.description || "");
  const [comboPrice, setComboPrice] = useState(combo?.combo_price || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(combo?.image_url || null);
  
  // Package Items state (selected items in the combo)
  const [packageItems, setPackageItems] = useState(() => {
    if (combo?.items_json && Array.isArray(combo.items_json)) {
      return combo.items_json.map((it) => ({
        id: String(it.item_id || it.id),
        item_id: String(it.item_id || it.id),
        name: it.name,
        price: parseFloat(it.price || it.original_price || 0),
        original_price: parseFloat(it.original_price || it.price || 0),
        quantity: it.quantity || 1,
        is_veg: it.is_veg !== undefined ? it.is_veg : true,
      }));
    }
    return [];
  });

  // Available Menu Items for this stall
  const [menuItems, setMenuItems] = useState(stallItems || []);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState("ALL"); // ALL, VEG, NON_VEG

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch stall items if not already available
  useEffect(() => {
    const targetStallId = stallId || combo?.stall_id;
    if (!targetStallId) return;

    if (!stallItems || stallItems.length === 0) {
      const fetchStallMenu = async () => {
        try {
          setLoadingMenu(true);
          const res = await axios.get(`${API_BASE}/items/stall/${targetStallId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const raw = Array.isArray(res.data) ? res.data : [];
          // Filter out combos so only base menu items can be added to package
          const validBaseItems = raw.filter(
            (it) => !it.is_combo && !(it.name && it.name.startsWith("🍱")) && it.id !== combo?.id
          );
          setMenuItems(validBaseItems);
        } catch (err) {
          console.error("Error fetching menu items:", err);
        } finally {
          setLoadingMenu(false);
        }
      };
      fetchStallMenu();
    } else {
      const validBaseItems = (stallItems || []).filter(
        (it) => !it.is_combo && !(it.name && it.name.startsWith("🍱")) && it.id !== combo?.id
      );
      setMenuItems(validBaseItems);
    }
  }, [stallId, combo, token, stallItems]);

  // Calculate dynamic regular total price from package items
  const totalRegularPrice = useMemo(() => {
    return packageItems.reduce((sum, item) => {
      const price = parseFloat(item.price || item.original_price || 0);
      const qty = parseInt(item.quantity || 1, 10);
      return sum + price * qty;
    }, 0);
  }, [packageItems]);

  const numPrice = parseFloat(comboPrice) || 0;
  const discountAmount = totalRegularPrice > numPrice ? (totalRegularPrice - numPrice).toFixed(2) : 0;
  const discountPercent =
    totalRegularPrice > 0 ? Math.round(((totalRegularPrice - numPrice) / totalRegularPrice) * 100) : 0;

  // Add an item to package
  const handleAddItem = (item) => {
    setPackageItems((prev) => {
      const itemId = String(item.id || item.item_id);
      const existing = prev.find((p) => String(p.id || p.item_id) === itemId);
      if (existing) {
        return prev.map((p) =>
          String(p.id || p.item_id) === itemId ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        const itemPrice = parseFloat(item.final_price || item.price || 0);
        return [
          ...prev,
          {
            id: itemId,
            item_id: itemId,
            name: item.name,
            price: itemPrice,
            original_price: itemPrice,
            quantity: 1,
            is_veg: item.is_veg !== undefined ? item.is_veg : true,
            image_url: item.image_url || null,
          },
        ];
      }
    });
    setError(null);
  };

  // Remove an item from package
  const handleRemoveItem = (itemId) => {
    setPackageItems((prev) => prev.filter((p) => String(p.id || p.item_id) !== String(itemId)));
  };

  // Update item quantity
  const handleQuantityChange = (itemId, delta) => {
    setPackageItems((prev) =>
      prev
        .map((p) => {
          if (String(p.id || p.item_id) === String(itemId)) {
            const newQty = (p.quantity || 1) + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean)
    );
  };

  // Apply quick discount percentage
  const handleApplyDiscount = (pct) => {
    if (totalRegularPrice <= 0) return;
    const discounted = Math.round(totalRegularPrice * (1 - pct / 100));
    setComboPrice(discounted);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Filtered available menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(menuSearch.toLowerCase());
      if (menuFilter === "VEG") return matchesSearch && item.is_veg;
      if (menuFilter === "NON_VEG") return matchesSearch && !item.is_veg;
      return matchesSearch;
    });
  }, [menuItems, menuSearch, menuFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Combo name is required");
      return;
    }
    if (packageItems.length < 2) {
      setError("Please select at least 2 items to make a combo package.");
      return;
    }
    if (numPrice <= 0) {
      setError("Combo selling price must be greater than ₹0");
      return;
    }
    if (totalRegularPrice > 0 && numPrice >= totalRegularPrice) {
      setError(`Combo price (₹${numPrice}) must be lower than the regular total price (₹${totalRegularPrice.toFixed(2)})`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Upload image if a new file was chosen
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        await axios.put(`${API_BASE}/combos/${combo.id}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // 2. Prepare items payload
      const itemsPayload = packageItems.map((it) => ({
        item_id: String(it.item_id || it.id),
        price: parseFloat(it.price || it.original_price || 0),
        quantity: parseInt(it.quantity || 1, 10),
      }));

      // 3. Update combo name, description, price, and components
      await axios.put(
        `${API_BASE}/combos/${combo.id}`,
        {
          name: name.trim(),
          description: description.trim() || null,
          combo_price: numPrice,
          items: itemsPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (onComboUpdated) {
        onComboUpdated();
      }
      onClose();
    } catch (err) {
      console.error("Error updating combo:", err);
      setError(
        err.response?.data?.detail || "Failed to update combo pack. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-combo-modal-overlay" onClick={onClose}>
      <div className="edit-combo-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-combo-modal-header">
          <div>
            <h3>Edit Combo Package & Items</h3>
            <p className="edit-combo-modal-subtitle">Customize package items, pricing, and photo</p>
          </div>
          <button className="edit-combo-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="edit-combo-error-banner">{error}</div>}

        <form onSubmit={handleSave} className="edit-combo-modal-body">
          {/* Combo Image Upload */}
          <div className="edit-combo-form-group">
            <label className="edit-combo-label">Combo Package Image</label>
            <div
              className={`edit-combo-image-uploader ${previewUrl ? "has-image" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="edit-combo-preview-container">
                  <img src={previewUrl} alt="Combo Preview" className="edit-combo-preview-img" />
                  <div className="edit-combo-preview-overlay">
                    <span>📷 Click or drop to change image</span>
                  </div>
                </div>
              ) : (
                <div className="edit-combo-dropzone-content">
                  <div className="edit-combo-upload-icon">📸</div>
                  <p className="edit-combo-upload-text">
                    <strong>Click to upload</strong> or drag & drop combo image
                  </p>
                  <span className="edit-combo-upload-hint">PNG, JPG, WebP up to 5MB</span>
                </div>
              )}
            </div>
            {previewUrl && (
              <div className="edit-combo-img-actions">
                <button
                  type="button"
                  className="edit-combo-change-img-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </button>
              </div>
            )}
          </div>

          {/* SECTION 1: INCLUDED PACKAGE ITEMS (SELECTED) */}
          <div className="edit-combo-form-group">
            <div className="edit-combo-section-header">
              <label className="edit-combo-label">
                Included Items in Package ({packageItems.length})
              </label>
              <span className="edit-combo-badge-count">
                {packageItems.length >= 2 ? "✅ Ready" : "⚠️ Min 2 items required"}
              </span>
            </div>

            {packageItems.length === 0 ? (
              <div className="edit-combo-items-empty">
                <span>🍱 No items in this package yet. Select items from the menu below!</span>
              </div>
            ) : (
              <div className="edit-combo-selected-items-list">
                {packageItems.map((item) => {
                  const itemId = String(item.id || item.item_id);
                  const itemSubtotal = (parseFloat(item.price || item.original_price || 0) * (item.quantity || 1)).toFixed(2);
                  return (
                    <div key={itemId} className="edit-combo-selected-item-row">
                      <div className="edit-combo-item-info">
                        <span className={`edit-combo-veg-indicator ${item.is_veg ? "veg" : "non-veg"}`}>
                          ●
                        </span>
                        <div className="edit-combo-item-texts">
                          <span className="edit-combo-item-name">{item.name}</span>
                          <span className="edit-combo-item-unit-price">₹{item.price || item.original_price} each</span>
                        </div>
                      </div>

                      <div className="edit-combo-item-controls">
                        {/* Quantity Stepper */}
                        <div className="edit-combo-qty-stepper">
                          <button
                            type="button"
                            className="edit-combo-qty-btn"
                            onClick={() => handleQuantityChange(itemId, -1)}
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="edit-combo-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="edit-combo-qty-btn"
                            onClick={() => handleQuantityChange(itemId, 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="edit-combo-item-subtotal">₹{itemSubtotal}</div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          className="edit-combo-remove-btn"
                          onClick={() => handleRemoveItem(itemId)}
                          title="Remove from package"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: ADD ITEMS FROM MENU */}
          <div className="edit-combo-form-group edit-combo-menu-browser">
            <div className="edit-combo-section-header">
              <label className="edit-combo-label">➕ Add Menu Items to Package</label>
              <span className="edit-combo-menu-count">{menuItems.length} menu items available</span>
            </div>

            {/* Menu Search & Filters */}
            <div className="edit-combo-menu-toolbar">
              <input
                type="text"
                className="edit-combo-menu-search"
                placeholder="Search stall menu items..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />
              <div className="edit-combo-menu-filter-chips">
                <button
                  type="button"
                  className={`edit-combo-filter-chip ${menuFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setMenuFilter("ALL")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`edit-combo-filter-chip ${menuFilter === "VEG" ? "active" : ""}`}
                  onClick={() => setMenuFilter("VEG")}
                >
                  🟢 Veg
                </button>
                <button
                  type="button"
                  className={`edit-combo-filter-chip ${menuFilter === "NON_VEG" ? "active" : ""}`}
                  onClick={() => setMenuFilter("NON_VEG")}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>

            {/* Available Items List */}
            <div className="edit-combo-menu-grid">
              {loadingMenu ? (
                <div className="edit-combo-menu-loading">Loading menu items...</div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="edit-combo-menu-empty">No items match your search.</div>
              ) : (
                filteredMenuItems.map((mItem) => {
                  const mId = String(mItem.id);
                  const isAlreadyInPackage = packageItems.some((p) => String(p.id || p.item_id) === mId);
                  const inPackageQty = packageItems.find((p) => String(p.id || p.item_id) === mId)?.quantity || 0;
                  const itemPrice = mItem.final_price || mItem.price || 0;

                  return (
                    <div
                      key={mId}
                      className={`edit-combo-menu-card ${isAlreadyInPackage ? "selected" : ""}`}
                    >
                      <div className="edit-combo-menu-card-left">
                        <span className={`edit-combo-veg-indicator ${mItem.is_veg ? "veg" : "non-veg"}`}>
                          ●
                        </span>
                        <div>
                          <div className="edit-combo-menu-name">{mItem.name}</div>
                          <div className="edit-combo-menu-price">₹{itemPrice}</div>
                        </div>
                      </div>

                      <div className="edit-combo-menu-card-right">
                        {isAlreadyInPackage ? (
                          <div className="edit-combo-menu-added-badge">
                            <span className="edit-combo-added-text">✓ Added ({inPackageQty})</span>
                            <button
                              type="button"
                              className="edit-combo-add-more-btn"
                              onClick={() => handleAddItem(mItem)}
                              title="Add one more"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="edit-combo-add-btn"
                            onClick={() => handleAddItem(mItem)}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 3: COMBO NAME & DESCRIPTION */}
          <div className="edit-combo-form-group">
            <label className="edit-combo-label">Combo Package Name *</label>
            <input
              type="text"
              className="edit-combo-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Booster Duo"
              required
            />
          </div>

          <div className="edit-combo-form-group">
            <label className="edit-combo-label">Combo Description</label>
            <textarea
              className="edit-combo-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description highlighting the pairing and value..."
              rows={2}
            />
          </div>

          {/* SECTION 4: PRICING & DISCOUNTS */}
          <div className="edit-combo-pricing-section">
            <div className="edit-combo-pricing-grid">
              <div className="edit-combo-form-group">
                <label className="edit-combo-label">Combo Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.5"
                  className="edit-combo-input edit-combo-price-input"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(e.target.value)}
                  placeholder="₹"
                  required
                />
              </div>

              <div className="edit-combo-form-group">
                <label className="edit-combo-label">Regular Total Price</label>
                <div className="edit-combo-readonly-price">₹{totalRegularPrice.toFixed(2)}</div>
              </div>
            </div>

            {/* Quick Discount Presets */}
            {totalRegularPrice > 0 && (
              <div className="edit-combo-preset-discounts">
                <span className="edit-combo-preset-label">Quick Discount:</span>
                <button type="button" onClick={() => handleApplyDiscount(10)} className="edit-combo-preset-btn">
                  10% OFF (₹{Math.round(totalRegularPrice * 0.9)})
                </button>
                <button type="button" onClick={() => handleApplyDiscount(15)} className="edit-combo-preset-btn">
                  15% OFF (₹{Math.round(totalRegularPrice * 0.85)})
                </button>
                <button type="button" onClick={() => handleApplyDiscount(20)} className="edit-combo-preset-btn">
                  20% OFF (₹{Math.round(totalRegularPrice * 0.8)})
                </button>
              </div>
            )}

            {/* Discount Calculation Banner */}
            {numPrice > 0 && totalRegularPrice > numPrice && (
              <div className="edit-combo-discount-preview">
                🎉 Customer saves <strong>₹{discountAmount}</strong> ({discountPercent}% discount)
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="edit-combo-modal-footer">
            <button
              type="button"
              className="edit-combo-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-combo-save-btn"
              disabled={saving || packageItems.length < 2 || numPrice <= 0 || numPrice >= totalRegularPrice}
            >
              {saving ? "Saving..." : "Save Package Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditComboModal;
