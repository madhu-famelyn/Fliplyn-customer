import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../../LayOut/AdminLayout";
import CreateGroup from "./CreateGroup";
import { useAuth } from "../../AuthContex/AdminContext";
import { FaEdit } from "react-icons/fa";
import UpdateGroupModal from "./UpdateGroupModel";
import GroupDetailsModal from "./GroupDetailsModel";
import "./CreateGroup.css"; // ✅ Import CSS

export default function Group() {
  const { userId: adminId, token } = useAuth();

  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);

  // NEW: for viewing details
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!adminId || !token) return;
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data || [];
        setBuildings(data);
        if (data.length > 0) {
          setBuildingId(data[0].id);
        }
      } catch (error) {
        console.error("❌ Failed to fetch buildings:", error);
      }
    };
    fetchBuildings();
  }, [adminId, token]);

  // ✅ Memoize fetchGroups
  const fetchGroups = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://admin-aged-field-2794.fly.dev/wallet-groups/by-building/${buildingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(res.data || []);
    } catch (error) {
      console.error("❌ Failed to fetch wallet groups:", error);
    } finally {
      setLoading(false);
    }
  }, [buildingId, token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleBuildingChange = (e) => setBuildingId(e.target.value);
  const handleGroupCreated = () => fetchGroups();
  const handleEditClick = (groupId) => setEditingGroupId(groupId);
  const handleCloseModal = () => setEditingGroupId(null);

  // NEW: handle clicking for details
  const handleViewDetails = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const closeDetailsModal = () => {
    setSelectedGroupId(null);
  };

  return (
    <AdminLayout>
      <div className="group-page-container">
        <h2>Wallet Groups</h2>

        {buildings.length > 1 && (
          <div className="building-selector">
            <label htmlFor="building-select">Select Building:</label>
            <select
              id="building-select"
              value={buildingId}
              onChange={handleBuildingChange}
            >
              <option value="">Select a building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {buildingId && (
          <CreateGroup
            onGroupCreated={handleGroupCreated}
            buildingId={buildingId}
          />
        )}

        <div className="group-list">
          {loading ? (
            <p>Loading wallet groups...</p>
          ) : groups.length === 0 ? (
            <p>No wallet groups found.</p>
          ) : (
            <ul>
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="group-item"
                  onClick={() => handleViewDetails(group.id)} // NEW: Click to view details
                  style={{ cursor: "pointer" }}
                >
                  <FaEdit
                    title="Edit group"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering details popup
                      handleEditClick(group.id);
                    }}
                    className="edit-icon"
                  />
                  <strong className="group-name">
                    {group.group_name || "Unnamed Group"}
                  </strong>

                  <p>
                    <strong>Users Count:</strong> {group.users?.length || 0}
                  </p>
                  <p>
                    <strong>Wallet Amount:</strong>{" "}
                    {group.wallet_amount ?? "N/A"}
                  </p>
                  <p>
                    <strong>Carry Forward:</strong>{" "}
                    {group.carry_forward ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Exclude Weekend:</strong>{" "}
                    {group.exclude_weekend ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Daily Wallet:</strong>{" "}
                    {group.daily_wallet ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Days Count:</strong>{" "}
                    {group.days_count ?? "N/A"}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {group.payment_method
                      ? group.payment_method.toUpperCase()
                      : "N/A"}
                  </p>

                  <p className="created-date">
                    <strong>Created:</strong>{" "}
                    {new Date(group.created_datetime).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Edit Group Modal */}
        {editingGroupId && (
          <UpdateGroupModal
            groupId={editingGroupId}
            onClose={handleCloseModal}
            onUpdated={fetchGroups}
            token={token}
          />
        )}

        {/* NEW: Group Details Modal */}
        {selectedGroupId && (
          <GroupDetailsModal
            groupId={selectedGroupId}
            token={token}
            onClose={closeDetailsModal}
          />
        )}
      </div>
    </AdminLayout>
  );
}
