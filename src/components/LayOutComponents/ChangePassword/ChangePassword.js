import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./ChangePassword.css";

export default function ChangePassword() {
  const { adminId, token } = useAuth();

  const [role, setRole] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [identifier, setIdentifier] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const BASE_URL = "https://admin-aged-field-2794.fly.dev";

  // ✅ Fetch buildings by admin ID
  useEffect(() => {
    if (adminId) {
      console.log("👑 Logged-in Admin ID:", adminId);
      axios
        .get(`${BASE_URL}/buildings/buildings/by-admin/${adminId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("🏢 Buildings fetched:", res.data);
          setBuildings(res.data || []);
        })
        .catch((err) => console.error("Error fetching buildings:", err));
    }
  }, [adminId, token]);

  // ✅ Fetch users by selected role and building
  const fetchUsersByRole = async (buildingId) => {
    console.log("Fetching users for role:", role, "and building:", buildingId);

    if (!role) return;

    try {
      let res;
      if (role === "hr") {
        res = await axios.get(`${BASE_URL}/hr/building/${buildingId}`);
        console.log("👥 HRs:", res.data);
        setUsers(res.data[0]?.hrs || []);
      } else if (role === "manager") {
        res = await axios.get(`${BASE_URL}/managers/building/${buildingId}`);
        console.log("👷 Managers:", res.data);
        setUsers(res.data || []);
      } else if (role === "buildingmanager") {
        res = await axios.get(
          `${BASE_URL}/api/building-managers/by-building/${buildingId}`
        );
        console.log("🏢 Building Manager:", res.data);
        setUsers([res.data]); // Single object
      } else if (role === "vendor") {
        res = await axios.get(`${BASE_URL}/vendors/by-admin/${adminId}`);
        console.log("🛍 Vendors:", res.data);
        setUsers(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ✅ Handle form submission (change password)
  const handleChangePassword = async (e) => {
    e.preventDefault();

    console.log("🔹 Submitting password change for role:", role);
    console.log("🔹 Admin ID:", adminId);
    console.log("🔹 Selected Building:", selectedBuilding);
    console.log("🔹 Selected User:", selectedUser);
    console.log("🔹 Identifier (email/userId):", identifier);

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (!newPassword || !oldPassword) {
      setMessage("❌ Please enter both old and new passwords");
      return;
    }

    const payload = {
      identifier:
        role === "user"
          ? identifier.trim()
          : selectedUser || identifier.trim(),
      new_password: newPassword,
    };

    try {
      const res = await axios.put(
        `${BASE_URL}/password/admin/change-password/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Password updated response:", res.data);
      setMessage(`✅ ${res.data.message}`);

      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser("");
      setIdentifier("");
    } catch (error) {
      console.error("❌ Error updating password:", error.response || error);
      setMessage(
        error.response?.data?.detail ||
          "❌ Failed to change password. Please try again."
      );
    }
  };

  return (
    <div className="change-password-container">
      <h2>🔐 Admin Change Password Panel</h2>

      {/* Role selection */}
      <div className="form-group">
        <label>Select Role:</label>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setUsers([]);
            setSelectedUser("");
            setSelectedBuilding("");
            setIdentifier("");
            setMessage("");
          }}
        >
          <option value="">-- Select Role --</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="manager">Manager</option>
          <option value="buildingmanager">Building Manager</option>
          <option value="vendor">Vendor</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Building selection (for HR, Manager, BuildingManager) */}
      {["hr", "manager", "buildingmanager"].includes(role) && (
        <div className="form-group">
          <label>Select Building:</label>
          <select
            value={selectedBuilding}
            onChange={(e) => {
              const bId = e.target.value;
              console.log("🏢 Selected Building ID:", bId);
              setSelectedBuilding(bId);
              fetchUsersByRole(bId);
            }}
          >
            <option value="">-- Select Building --</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.building_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User selection */}
      {["hr", "manager", "buildingmanager", "vendor"].includes(role) &&
        users.length > 0 && (
          <div className="form-group">
            <label>Select {role}:</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                console.log("👤 Selected User ID:", e.target.value);
                setSelectedUser(e.target.value);
              }}
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email || u.company_email || u.phone_number})
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Identifier input for User (email-based) */}
      {role === "user" && (
        <div className="form-group">
          <label>User Email:</label>
          <input
            type="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter user email"
          />
        </div>
      )}

      {/* Old Password */}
      <div className="form-group">
        <label>Old Password:</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Enter old password"
        />
      </div>

      {/* New Password */}
      <div className="form-group">
        <label>New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label>Confirm Password:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
      </div>

      <button onClick={handleChangePassword} className="submit-button">
        Update Password
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
