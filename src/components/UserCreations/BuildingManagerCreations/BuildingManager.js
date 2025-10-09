import React, { useEffect, useState } from "react";
import AdminLayout from "../../LayOut/AdminLayout";
import { useAuth } from "../../AuthContex/AdminContext";
import axios from "axios";
import "./BuildingManager.css"; // optional, if you want styling

export default function ViewBuildingManagers() {
  const { adminId, token } = useAuth();
  const [managers, setManagers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company_email: "",
    password: "",
    building_id: "",
  });

  useEffect(() => {
    if (adminId && token) {
      fetchBuildingsAndManagers();
    }
    // eslint-disable-next-line
  }, [adminId, token]);

  // ===========================
  // Fetch buildings and managers
  // ===========================
  const fetchBuildingsAndManagers = async () => {
    try {
      setLoading(true);

      // 1️⃣ Get buildings by admin_id
      const buildingsRes = await axios.get(
        `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );

      const buildingsData = buildingsRes.data || [];
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
          `https://admin-aged-field-2794.fly.dev/api/building-managers/by-building/${building.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: "application/json",
            },
          }
        );

        // ✅ Handle both single-object and list responses
        let managerData = managersRes.data;
        if (!managerData) continue;
        if (!Array.isArray(managerData)) managerData = [managerData];

        const managersWithBuilding = managerData.map((m) => ({
          ...m,
          building_name: building.building_name,
        }));

        allManagers.push(...managersWithBuilding);
      }

      setManagers(allManagers);
    } catch (error) {
      console.error("Error fetching managers:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Create manager
  // ===========================
  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      await axios.post(`https://admin-aged-field-2794.fly.dev/api/building-managers/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert("✅ Manager created successfully!");
      setShowForm(false);
      setFormData({
        name: "",
        company_email: "",
        password: "",
        building_id: "",
      });
      fetchBuildingsAndManagers();
    } catch (error) {
      console.error("Error creating manager:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "❌ Failed to create manager");
    }
  };

  // ===========================
  // Handle form inputs
  // ===========================
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ===========================
  // Render
  // ===========================
  return (
    <AdminLayout>
      <div className="view-managers-container">
        <div className="header-section">
          <h1>Building Managers</h1>
          <button className="create-btn" onClick={() => setShowForm(true)}>
            + Add Manager
          </button>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : managers.length === 0 ? (
          <p className="no-data">No managers found for your buildings.</p>
        ) : (
          <table className="managers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Building</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.id}>
                  <td>{manager.name}</td>
                  <td>{manager.company_email}</td>
                  <td>{manager.building_name || "-"}</td>
                  <td>
                    {manager.created_datetime
                      ? new Date(manager.created_datetime).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Add Building Manager</h2>
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
                  name="company_email"
                  placeholder="Email"
                  value={formData.company_email}
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
