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

  // 🔍 Initial log of user context
  console.log("🧠 useAuth context:", { user, token, admin_id, building_id });

  useEffect(() => {
    if (building_id) {
      console.log("🏢 Building ID detected:", building_id);
      fetchVendors();
      fetchStalls();
    } else {
      console.warn("⚠️ No building_id found — vendor/stall data will not load");
    }
    // eslint-disable-next-line
  }, [building_id]);

  // Fetch vendors linked to this building
const fetchVendors = async () => {
  if (!building_id) {
    console.warn("⚠️ No building_id found — vendor data will not load");
    setVendors([]);
    setLoading(false);
    return;
  }

  console.log("📡 Fetching vendors for building:", building_id);
  try {
    const response = await axios.get(
      `https://admin-aged-field-2794.fly.dev/buildings/${building_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      }
    );

    console.log("✅ Building fetched:", response.data);

    // Extract vendors array safely
    const vendorsData = Array.isArray(response.data.vendors)
      ? response.data.vendors
      : response.data.vendors
      ? [response.data.vendors]
      : [];

    console.log("📦 Vendors state:", vendorsData);
    setVendors(vendorsData);
  } catch (error) {
    console.error("❌ Error fetching vendors:", error.response?.data || error.message);
    setVendors([]); // fallback
  } finally {
    setLoading(false);
  }
};


  // Fetch stalls for manager’s building
  const fetchStalls = async () => {
    console.log("📡 Fetching stalls for building:", building_id);
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/stalls/building/${building_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      console.log("✅ Stalls fetched:", response.data);
      setStalls(response.data);
    } catch (error) {
      console.error("❌ Error fetching stalls:", error.response || error.message);
    }
  };

  // Create new vendor
  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      phone_number,
      password,
      stall_ids: selectedStalls.map((s) => s.value),
      admin_id,
      building_id,
    };

    console.log("📝 Creating vendor with payload:", payload);

    try {
      const response = await axios.post(
        `https://admin-aged-field-2794.fly.dev/vendors/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("✅ Vendor created successfully:", response.data);

      setModalOpen(false);
      setName("");
      setPhoneNumber("");
      setPassword("");
      setSelectedStalls([]);
      fetchVendors(); // refresh list
    } catch (error) {
      console.error("❌ Error creating vendor:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create vendor. Check console logs.");
    }
  };

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

  console.log("📦 Vendors state:", vendors);
  console.log("📦 Stalls state:", stalls);

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
