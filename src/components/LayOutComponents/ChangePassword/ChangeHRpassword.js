import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";
import "./ChangeHRPassword.css";

export default function ChangeHrPassword() {
  const { adminId, token } = useAuth();

  const [buildings, setBuildings] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedHr, setSelectedHr] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch buildings by admin ID
  useEffect(() => {
    if (!adminId) return;

    const fetchBuildings = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              Accept: "application/json",
            },
          }
        );
        setBuildings(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch buildings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, [adminId, token]);

  // Fetch HRs when a building is selected
  useEffect(() => {
    if (!selectedBuilding) {
      setHrs([]);
      return;
    }

    const fetchHrs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/hr/building/${selectedBuilding}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              Accept: "application/json",
            },
          }
        );
        setHrs(res.data.hrs || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch HR users for this building.");
      } finally {
        setLoading(false);
      }
    };

    fetchHrs();
  }, [selectedBuilding, token]);

  // Handle password update
  const handleChangePassword = async () => {
    if (!selectedHr) {
      setError("Please select an HR user.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.put(
        "https://admin-aged-field-2794.fly.dev/password/admin/change-password/",
        {
          identifier: selectedHr,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200) {
        setMessage(res.data.message || "Password updated successfully.");
        setNewPassword("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to update password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-pass-page">
      <h2 className="hr-pass-title">Change HR Password</h2>

      <div className="hr-pass-form">
        {/* Building Dropdown */}
        <label htmlFor="buildingSelect">Select Building</label>
        <select
          id="buildingSelect"
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
        >
          <option value="">-- Select Building --</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.building_name}
            </option>
          ))}
        </select>

        {/* HR Dropdown */}
        {hrs.length > 0 && (
          <>
            <label htmlFor="hrSelect">Select HR</label>
            <select
              id="hrSelect"
              value={selectedHr}
              onChange={(e) => setSelectedHr(e.target.value)}
            >
              <option value="">-- Select HR --</option>
              {hrs.map((hr) => (
                <option key={hr.id} value={hr.id}>
                  {hr.name} ({hr.email})
                </option>
              ))}
            </select>
          </>
        )}

        {/* Password Input */}
        {selectedHr && (
          <>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button onClick={handleChangePassword} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
