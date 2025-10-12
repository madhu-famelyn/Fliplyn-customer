// src/pages/manager/ViewVendors.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContex/ContextAPI";
import axios from "axios";
import Select from "react-select";
import "./AddVendor.css";

export default function OMViewVendors() {
  const { token, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [selectedStalls, setSelectedStalls] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);

  const admin_id = selectedAdmin?.value || user?.admin_id;
  const building_id = user?.building_id;

  useEffect(() => {
    if (building_id) {
      fetchVendors();
      fetchStalls();
      fetchAdmins(); // for OM users
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [building_id]);

  // ==============================
  // Fetch Vendors
  // ==============================
  const fetchVendors = async () => {
    if (!building_id) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/vendors/by-admin/${user.admin_id}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );
      setVendors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching vendors:", error.response?.data || error.message);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Fetch Stalls
  // ==============================
  const fetchStalls = async () => {
    if (!building_id) return;
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/stalls/building/${building_id}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );
      setStalls(response.data);
    } catch (error) {
      console.error("Error fetching stalls:", error.response?.data || error.message);
      setStalls([]);
    }
  };

  // ==============================
  // Fetch Admins (OM)
  // ==============================
  const fetchAdmins = async () => {
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/admins`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );
      setAdmins(response.data.map(a => ({ value: a.id, label: a.name })));
    } catch (error) {
      console.error("Error fetching admins:", error.response?.data || error.message);
      setAdmins([]);
    }
  };

  // ==============================
  // Create Vendor
  // ==============================
  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const payload = {
      name: vendorName,
      phone_number: vendorPhone,
      password: vendorPassword,
      stall_ids: selectedStalls.map((s) => s.value),
    };

    if (!admin_id) {
      alert("Please select a valid admin for this vendor.");
      return;
    }

    try {
      setCreating(true);
      await axios.post(
        `https://admin-aged-field-2794.fly.dev/vendors/create?admin_id=${admin_id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Reset form & close modal
      setModalOpen(false);
      setVendorName("");
      setVendorPhone("");
      setVendorPassword("");
      setSelectedStalls([]);
      setSelectedAdmin(null);

      fetchVendors(); // Refresh vendor list
    } catch (error) {
      console.error("Error creating vendor:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create vendor");
    } finally {
      setCreating(false);
    }
  };

  // ==============================
  // Utility Functions
  // ==============================
  const stallOptions = stalls.map((stall) => ({ value: stall.id, label: stall.name }));

  const getStallNames = (vendor) => {
    if (!vendor.stall_ids || vendor.stall_ids.length === 0) return "—";
    return vendor.stall_ids
      .map((id) => stalls.find((s) => s.id === id)?.name || "Unknown")
      .join(", ");
  };

  // ==============================
  // UI Rendering
  // ==============================
  return (
    <div className="om-vendors-page">
      <div className="om-vendors-header">
        <h1 className="om-vendors-title">Vendors List</h1>
        <button className="om-create-vendor-btn" onClick={() => setModalOpen(true)}>
          + Create Vendor
        </button>
      </div>

      {loading ? (
        <p className="om-loading-text">Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p className="om-no-vendors-text">No vendors found.</p>
      ) : (
        <div className="om-vendors-table-wrapper">
          <table className="om-vendors-table">
            <thead>
              <tr>
                <th className="om-col-name">Name</th>
                <th className="om-col-phone">Phone Number</th>
                <th className="om-col-stalls">Stalls</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.name}</td>
                  <td>{vendor.phone_number}</td>
                  <td>{getStallNames(vendor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="om-modal">
          <div className="om-modal-content">
            <h2 className="om-modal-title">Create Vendor</h2>
            <form className="om-vendor-form" onSubmit={handleCreateVendor}>
              <input
                className="om-input-name"
                type="text"
                placeholder="Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
              />
              <input
                className="om-input-phone"
                type="text"
                placeholder="Phone Number"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                required
              />
              <input
                className="om-input-password"
                type="password"
                placeholder="Password"
                value={vendorPassword}
                onChange={(e) => setVendorPassword(e.target.value)}
                required
              />

              <label className="om-stall-label">Select Stalls:</label>
              <Select
                options={stallOptions}
                value={selectedStalls}
                onChange={setSelectedStalls}
                isMulti
                placeholder="Select stalls..."
                className="om-stalls-select"
              />

              {/* Admin selection for OM */}
              {!user.admin_id && (
                <>
                  <label className="om-admin-label">Select Admin:</label>
                  <Select
                    options={admins}
                    value={selectedAdmin}
                    onChange={setSelectedAdmin}
                    placeholder="Select admin..."
                    className="om-admin-select"
                  />
                </>
              )}

              <div className="om-modal-actions">
                <button type="submit" className="om-save-btn" disabled={creating}>
                  {creating ? "Creating..." : "Save"}
                </button>
                <button
                  type="button"
                  className="om-cancel-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
