import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContex/AdminContext";
import AdminLayout from "../../LayOut/AdminLayout";
import axios from "axios";
import Select from "react-select";
import "./Vendor.css";

export default function ViewVendors() {
  const { adminId, token } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStalls, setSelectedStalls] = useState([]);

  useEffect(() => {
    if (adminId) {
      fetchVendors();
      fetchStalls();
    }
    // eslint-disable-next-line
  }, [adminId]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/vendors/by-admin/${adminId}`,
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

  const fetchStalls = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/stalls/admin/${adminId}`,
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

  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      phone_number,
      password,
      stall_ids: selectedStalls.map((s) => s.value),
    };

    try {
      await axios.post(
        `http://127.0.0.1:8000/vendors/create?admin_id=${adminId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Reset form
      setModalOpen(false);
      setName("");
      setPhoneNumber("");
      setPassword("");
      setSelectedStalls([]);
      fetchVendors(); // Refresh vendor list
    } catch (error) {
      console.error("Error Creating Vendor:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create vendor. Check console logs.");
    }
  };

  // Prepare options for react-select
  const stallOptions = stalls.map((stall) => ({
    value: stall.id,
    label: stall.name,
  }));

  // Helper: convert vendor's stall_ids to names
  const getStallNames = (vendor) => {
    if (!vendor.stall_ids || vendor.stall_ids.length === 0) return "—";
    return vendor.stall_ids
      .map((id) => stalls.find((s) => s.id === id)?.name || "Unknown")
      .join(", ");
  };

  return (
    <AdminLayout>
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
    </AdminLayout>
  );
}
