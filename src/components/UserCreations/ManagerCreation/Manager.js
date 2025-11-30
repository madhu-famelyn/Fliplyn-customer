import React, { useEffect, useState } from "react";
import AdminLayout from "../../LayOut/AdminLayout";
import { useAuth } from "../../AuthContex/AdminContext";
import axios from "axios";
import "./Manager.css";

export default function ViewManagers() {
  const { adminId, token } = useAuth();
  const [managers, setManagers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    building_id: "",
  });

  useEffect(() => {
    if (adminId) {
      fetchBuildingsAndManagers();
    }
    // eslint-disable-next-line
  }, [adminId]);

  const fetchBuildingsAndManagers = async () => {
    try {
      // 1️⃣ Get buildings by admin_id
      const buildingsRes = await axios.get(
        `https://admin-aged-field-2794.fly.dev/buildings/buildings/buildings/by-admin/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );

      const buildingsData = buildingsRes.data;
      setBuildings(buildingsData);

      if (buildingsData.length === 0) {
        setManagers([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch managers for each building
      const allManagers = [];
      for (const building of buildingsData) {
        const managersRes = await axios.get(
          `https://admin-aged-field-2794.fly.dev/managers/building/${building.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: "application/json",
            },
          }
        );

        // Add building name to each manager object for display
        const managersWithBuilding = managersRes.data.map((m) => ({
          ...m,
          building_name: building.building_name,
        }));

        allManagers.push(...managersWithBuilding);
      }

      setManagers(allManagers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching managers:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        admin_id: adminId,
      };

      await axios.post(`https://admin-aged-field-2794.fly.dev/managers/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert("✅ Manager created successfully!");
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        password: "",
        building_id: "",
      });
      fetchBuildingsAndManagers(); // refresh list
    } catch (error) {
      console.error("Error creating manager:", error);
      alert("❌ Failed to create manager");
    }
  };

  return (
    <AdminLayout>
      <div className="view-managers-container">
        <div className="header-section">
          <h1>Managers List</h1>
          <button className="create-btn" onClick={() => setShowForm(true)}>
            + Create Manager
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : managers.length === 0 ? (
          <p>No managers found.</p>
        ) : (
          <table className="managers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Building</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.id}>
                  <td>{manager.name}</td>
                  <td>{manager.email}</td>
                  <td>{manager.phone_number}</td>
                  <td>{manager.building_name || "-"}</td>
                  <td>{new Date(manager.created_datetime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showForm && (
          <div className="modal">
            <div className="modal-content">
              <h2>Create Manager</h2>
              <form onSubmit={handleCreateManager}>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="phone_number"
                  placeholder="Phone Number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="building_id"
                  value={formData.building_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.building_name}
                    </option>
                  ))}
                </select>

                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowForm(false)}
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
