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
      console.log("🟢 Admin ID available:", adminId);
      fetchVendors();
      fetchStalls();
    } else {
      console.log("⚠️ No adminId found, skipping fetch.");
    }
    // eslint-disable-next-line
  }, [adminId]);

  // =========================
  // Fetch Vendors
  // =========================
  const fetchVendors = async () => {
    console.log("📡 Fetching vendors for adminId:", adminId);
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/vendors/by-admin/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      console.log("✅ Vendors fetched successfully:", response.data);
      setVendors(response.data);
    } catch (error) {
      console.error("❌ Error fetching vendors:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Fetch Stalls
  // =========================
  const fetchStalls = async () => {
    console.log("📡 Fetching stalls for adminId:", adminId);
    try {
      const response = await axios.get(
        `https://admin-aged-field-2794.fly.dev/stalls/admin/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      console.log("✅ Stalls fetched successfully:", response.data);
      setStalls(response.data);
    } catch (error) {
      console.error("❌ Error fetching stalls:", error.response?.data || error);
    }
  };

  // =========================
  // Handle Vendor Creation
  // =========================
  const handleCreateVendor = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      phone_number,
      password,
      stall_ids: selectedStalls.map((s) => s.value),
    };

    console.log("📝 Vendor creation payload:", payload);

    try {
      const response = await axios.post(
        `https://admin-aged-field-2794.fly.dev/vendors/create?admin_id=${adminId}`,
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

      // Reset form
      setModalOpen(false);
      setName("");
      setPhoneNumber("");
      setPassword("");
      setSelectedStalls([]);

      console.log("🧹 Form reset and refreshing vendor list...");
      fetchVendors(); // Refresh vendor list
    } catch (error) {
      console.error("❌ Error Creating Vendor:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Failed to create vendor. Check console logs.");
    }
  };

  // =========================
  // React Select Options
  // =========================
  const stallOptions = stalls.map((stall) => ({
    value: stall.id,
    label: stall.name,
  }));

  console.log("📦 Stall Options prepared:", stallOptions);

  // =========================
  // Helper: Vendor Stall Names
  // =========================
  const getStallNames = (vendor) => {
    if (!vendor.stall_ids || vendor.stall_ids.length === 0) return "—";
    const names = vendor.stall_ids
      .map((id) => stalls.find((s) => s.id === id)?.name || "Unknown")
      .join(", ");
    console.log(`🏪 Vendor ${vendor.name} linked stalls:`, names);
    return names;
  };

  // =========================
  // Render
  // =========================
  console.log("📊 Rendering Vendors:", vendors);
  console.log("🏢 Rendering Stalls:", stalls);
  console.log("🟠 Modal Open:", modalOpen);

  return (
    <AdminLayout>
      <div className="view-vendors-container">
        <div className="header-section">
          <h1>Vendors List</h1>
          <button
            className="create-btn"
            onClick={() => {
              console.log("➕ Opening vendor creation modal");
              setModalOpen(true);
            }}
          >
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

        {/* =========================
            Modal Section
        ========================== */}
        {modalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>Create Vendor</h2>
              <form onSubmit={handleCreateVendor}>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    console.log("✏️ Name changed:", e.target.value);
                  }}
                  required
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phone_number}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    console.log("📞 Phone number changed:", e.target.value);
                  }}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    console.log("🔐 Password updated");
                  }}
                  required
                />

                <label>Select Stalls:</label>
                <Select
                  options={stallOptions}
                  value={selectedStalls}
                  onChange={(selected) => {
                    setSelectedStalls(selected);
                    console.log("🏬 Selected stalls:", selected);
                  }}
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
                    onClick={() => {
                      console.log("❌ Closing modal without saving");
                      setModalOpen(false);
                    }}
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
