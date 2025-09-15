import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../../LayOut/AdminLayout";
import CreateGroup from "./CreateGroup";
import { useAuth } from "../../AuthContex/ContextAPI";
import { FaEdit } from "react-icons/fa";
import UpdateGroupModal from "./UpdateGroupModel";
import GroupDetailsModal from "./GroupDetailsModel";
import "./CreateGroup.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function Group() {
  const { userId: adminId, token } = useAuth();

  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch buildings for dropdown
  useEffect(() => {
    if (!adminId || !token) return;

    const fetchBuildings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/buildings/buildings/by-admin/${adminId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || [];
        setBuildings(data);
        if (data.length > 0) setBuildingId(data[0].id);
      } catch (error) {
        console.error("❌ Failed to fetch buildings:", error);
      }
    };

    fetchBuildings();
  }, [adminId, token]);

  // Fetch wallet groups for selected building
  const fetchGroups = useCallback(async () => {
    if (!buildingId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/wallet-groups/by-building/${buildingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // Handlers
  const handleBuildingChange = (e) => setBuildingId(e.target.value);
  const handleGroupCreated = () => fetchGroups();
  const handleEditClick = (groupId) => setEditingGroupId(groupId);
  const handleCloseModal = () => setEditingGroupId(null);
  const handleViewDetails = (groupId) => setSelectedGroupId(groupId);
  const closeDetailsModal = () => setSelectedGroupId(null);

  return (
    <AdminLayout>
      <div className="group-page-container">
        <h2>Wallet Groups</h2>

        {buildings.length > 1 && (
          <div className="building-selector">
            <label htmlFor="building-select">Select Building:</label>
            <select id="building-select" value={buildingId} onChange={handleBuildingChange}>
              <option value="">Select a building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name || "Unnamed Building"}
                </option>
              ))}
            </select>
          </div>
        )}

        {buildingId && <CreateGroup onGroupCreated={handleGroupCreated} buildingId={buildingId} />}

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
                  onClick={() => handleViewDetails(group.id)}
                  style={{ cursor: "pointer" }}
                >
                  <FaEdit
                    title="Edit group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(group.id);
                    }}
                    className="edit-icon"
                  />
                  <strong className="group-name">{group.group_name || "Unnamed Group"}</strong>

                  <p><strong>Users Count:</strong> {group.users?.length || 0}</p>
                  <p><strong>Wallet Amount:</strong> {group.wallet_amount ?? "N/A"}</p>
                  <p><strong>Carry Forward:</strong> {group.carry_forward ? "Yes" : "No"}</p>
                  <p><strong>Exclude Weekend:</strong> {group.exclude_weekend ? "Yes" : "No"}</p>
                  <p><strong>Daily Wallet:</strong> {group.daily_wallet ? "Yes" : "No"}</p>
                  <p><strong>Days Count:</strong> {group.days_count ?? "N/A"}</p>
                  <p><strong>Payment Method:</strong> {group.payment_method?.toUpperCase() ?? "N/A"}</p>
                  <p className="created-date">
                    <strong>Created:</strong> {new Date(group.created_datetime).toLocaleString()}
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

        {/* Group Details Modal */}
        {selectedGroupId && (
          <GroupDetailsModal groupId={selectedGroupId} token={token} onClose={closeDetailsModal} />
        )}
      </div>
    </AdminLayout>
  );
}
