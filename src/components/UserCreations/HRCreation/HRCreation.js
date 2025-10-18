import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import "./HRCreation.css";

export default function CreateHR() {
  const { adminId } = useAuth();
  const [buildings, setBuildings] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    company: "",
    password: "",
    building_id: "",
  });

  // === Fetch buildings and HRs ===
  useEffect(() => {
    const fetchBuildingsAndHRs = async () => {
      console.log("🔹 Fetching Buildings and HRs...");
      console.log("➡️ Admin ID:", adminId);

      if (!adminId) {
        setError("Admin ID missing. Please re-login as admin.");
        console.error("❌ Admin ID missing in context.");
        return;
      }

      setLoading(true);
      try {
        // Fetch buildings by admin
        const buildingsURL = `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`;
        console.log("🌐 GET Buildings API:", buildingsURL);

        const resBuildings = await axios.get(buildingsURL);
        console.log("✅ Buildings API Response:", resBuildings.data);

        const buildingList = resBuildings.data || [];
        setBuildings(buildingList);

        // Fetch HRs for each building
        const hrPromises = buildingList.map((b) => {
          const hrURL = `https://admin-aged-field-2794.fly.dev/hr/building/${b.id}`;
          console.log("🌐 GET HRs for Building:", b.id, "| URL:", hrURL);
          return axios.get(hrURL);
        });

        const hrResults = await Promise.all(hrPromises);
        console.log("✅ HR Results Array:", hrResults.map((res) => res.data));

        const allHRs = hrResults
          .flatMap((res) => res.data?.hrs || [])
          .filter((hr) => hr);
        setHrs(allHRs);

        console.log("📋 Final HR List:", allHRs);
      } catch (err) {
        console.error("❌ Error fetching buildings or HRs:", err.response || err.message);
        setError("Failed to fetch buildings or HRs.");
      } finally {
        setLoading(false);
        console.log("✅ Fetch complete.");
      }
    };

    fetchBuildingsAndHRs();
  }, [adminId]);

  // === Submit new HR ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const { name, email, phone_number, company, password, building_id } = formData;
    console.log("📝 Submitting HR Creation Form:", formData);
    console.log("➡️ Admin ID:", adminId);

    if (!building_id || !name || !email || !phone_number || !company || !password) {
      setError("Please fill all fields.");
      console.warn("⚠️ Missing required fields in form.");
      setLoading(false);
      return;
    }

    try {
      const hrCreateURL = "https://admin-aged-field-2794.fly.dev/hr/";
      console.log("🌐 POST HR Create API:", hrCreateURL);

      const payload = {
        admin_id: adminId,
        building_id,
        name,
        email,
        phone_number,
        company,
        password,
      };

      console.log("📦 Payload:", payload);

      const res = await axios.post(hrCreateURL, payload, {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });

      console.log("✅ HR Created Successfully:", res.data);
      setMessage(`HR ${res.data.name} created successfully.`);
      setShowForm(false);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        company: "",
        password: "",
        building_id: "",
      });

      // Refresh HR list
      console.log("🔄 Refreshing HR list after creation...");
      const hrPromises = buildings.map((b) => {
        const hrURL = `https://admin-aged-field-2794.fly.dev/hr/building/${b.id}`;
        console.log("🌐 Refetch HRs for building:", b.id);
        return axios.get(hrURL);
      });

      const hrResults = await Promise.all(hrPromises);
      const allHRs = hrResults.flatMap((res) => res.data?.hrs || []).filter((hr) => hr);
      console.log("📋 Updated HR List:", allHRs);

      setHrs(allHRs);
    } catch (err) {
      console.error("❌ Error creating HR:", err.response || err.message);
      setError(err.response?.data?.detail || "Something went wrong while creating HR.");
    } finally {
      setLoading(false);
    }
  };

  // === Handle form input ===
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`✏️ Input Changed: ${name} = ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  // === JSX ===
  return (
    <div className="view-managers-container">
      <div className="header-section">
        <h1>HR Management</h1>
        <button className="create-btn" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close Create HR Form" : "Open Create HR Form"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create HR</h2>
            <form onSubmit={handleSubmit}>
              <select
                name="building_id"
                value={formData.building_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.building_name || b.user_name || "Unnamed Building"}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="name"
                placeholder="HR Name"
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
                type="text"
                name="company"
                placeholder="Company"
                value={formData.company}
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

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>

              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      )}

      {/* HR Table */}
      {loading && <p className="loading">Loading HRs...</p>}
      {hrs.length > 0 ? (
        <table className="managers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Building</th>
            </tr>
          </thead>
          <tbody>
            {hrs.map((hr) => {
              const buildingName =
                buildings.find((b) => b.id === hr.building_id)?.building_name || "Unnamed Building";
              return (
                <tr key={hr.id}>
                  <td>{hr.name}</td>
                  <td>{hr.email}</td>
                  <td>{hr.phone_number}</td>
                  <td>{hr.company}</td>
                  <td>{buildingName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        !loading && <p className="no-data">No HRs found for any building.</p>
      )}
    </div>
  );
}
