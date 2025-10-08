// src/pages/manager/ViewVendors.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContex/ContextAPI"; // ✅ Manager Auth Context
import axios from "axios";
import Select from "react-select";
import "./AddVendor.css";

export default function ManagerViewVendors() {
  const { token, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStalls, setSelectedStalls] = useState([]);

  const admin_id = user?.admin_id;
  const building_id = user?.building_id;

  useEffect(() => {
    if (building_id) {
      fetchVendors();
      fetchStalls();
    }
    // eslint-disable-next-line
  }, [building_id]);

  // Fetch vendors linked to the same building
  const fetchVendors = async () => {
    try {
      const response = await axios.get(
        `https://fliplyn.onrender.com/vendors/by-building/${building_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stalls for manager’s building
  const fetchStalls = async () => {
    try {
      const response = await axios.get(
        `https://fliplyn.onrender.com/stalls/building/${building_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      setStalls(response.data);
    } catch (error) {
      console.error("Error fetching stalls:", error);
    }
  };

  // Create new vendor under this building
  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      phone_number,
      password,
      stall_ids: selectedStalls.map((s) => s.value),
      admin_id, // ✅ from manager context
      building_id, // ✅ from manager context
    };

    try {
      await axios.post(`https://fliplyn.onrender.com/vendors/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      setModalOpen(false);
      setName("");
      setPhoneNumber("");
      setPassword("");
      setSelectedStalls([]);
      fetchVendors(); // refresh list
    } catch (error) {
      console.error("Error creating vendor:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create vendor. Check console logs.");
    }
  };

  // Prepare options for react-select
  const stallOptions = stalls.map((stall) => ({
    value: stall.id,
    label: stall.name,
  }));

  const getStallNames = (vendor) => {
    if (!vendor.stall_ids || vendor.stall_ids.length === 0) return "—";
    return vendor.stall_ids
      .map((id) => stalls.find((s) => s.id === id)?.name || "Unknown")
      .join(", ");
  };

  return (
      <div className="view-vendors-container">
        <div className="header-section">
          <h1>Vendors List</h1>
          <button className="create-btn" onClick={() => setModalOpen(true)}>
            + Create Vendor
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : vendors.length === 0 ? (
          <p>No vendors found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="vendors-table">
              <thead>
                <tr>
                  <th className="small-col">Name</th>
                  <th className="small-col">Phone Number</th>
                  <th className="large-col">Stalls</th>
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
          <div className="modal">
            <div className="modal-content">
              <h2>Create Vendor</h2>
              <form onSubmit={handleCreateVendor}>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone_number}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <label>Select Stalls:</label>
                <Select
                  options={stallOptions}
                  value={selectedStalls}
                  onChange={setSelectedStalls}
                  isMulti
                  placeholder="Select stalls..."
                />

                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
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
