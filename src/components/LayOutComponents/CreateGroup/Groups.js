import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../../LayOut/AdminLayout";
import CreateGroup from "./CreateGroup";
import { useAuth } from "../../AuthContex/AdminContext";
import { FaEdit, FaEye } from "react-icons/fa";
import UpdateGroupModal from "./UpdateGroupModel";
import GroupDetailsModal from "./GroupDetailsModel";
import "./CreateGroup.css"; // ✅ For styling

export default function Group() {
  const { userId: adminId, token } = useAuth();

  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // For modals
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // For toggling the create form
  const [showForm, setShowForm] = useState(false);

  // ✅ Fetch Buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!adminId || !token) return;
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/buildings/by-admin/${adminId}`,
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

  // ✅ Fetch Groups
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
  const handleGroupCreated = () => {
    fetchGroups();
    setShowForm(false);
  };

  // Edit & Details
  const handleEditClick = (groupId) => setEditingGroupId(groupId);
  const handleCloseEditModal = () => setEditingGroupId(null);
  const handleViewDetails = (groupId) => setSelectedGroupId(groupId);
  const handleCloseDetailsModal = () => setSelectedGroupId(null);

  return (
    <AdminLayout>
      <div className="group-page-container">
        {/* Header */}
        <div className="form-header">
          <h2>Wallet Groups</h2>
          <button
            type="button"
            className="open-form-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "Open Form"}
          </button>
        </div>

        {/* Building Selector */}
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

        {/* Create Group Form */}
        {showForm && buildingId && (
          <div className="group-create-form-wrapper">
            <CreateGroup
              onGroupCreated={handleGroupCreated}
              buildingId={buildingId}
            />
          </div>
        )}

        {/* Table of Groups */}
        <div className="group-table-section">
          {loading ? (
            <p>Loading wallet groups...</p>
          ) : groups.length === 0 ? (
            <p>No wallet groups found.</p>
          ) : (
            <div className="group-table-wrapper">
              <table className="group-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Group Name</th>
                    <th>Users</th>
                    <th>Wallet Amount</th>
                    <th>Carry Fwd</th>
                    <th>Exclude Weekend</th>
                    <th>Daily Wallet</th>
                    <th>Days Count</th>
                    <th>Payment Method</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, index) => (
                    <tr key={group.id}>
                      <td>{index + 1}</td>
                      <td>{group.group_name || "Unnamed Group"}</td>
                      <td>{group.users?.length || 0}</td>
                      <td>{group.wallet_amount ?? "N/A"}</td>
                      <td>{group.carry_forward ? "Yes" : "No"}</td>
                      <td>{group.exclude_weekend ? "Yes" : "No"}</td>
                      <td>{group.daily_wallet ? "Yes" : "No"}</td>
                      <td>{group.days_count ?? "N/A"}</td>
                      <td>
                        {group.payment_method
                          ? group.payment_method.toUpperCase()
                          : "N/A"}
                      </td>
                      <td>
                        {new Date(group.created_datetime).toLocaleString()}
                      </td>
                      <td>
                        <FaEye
                          className="action-icon view-icon"
                          title="View Details"
                          onClick={() => handleViewDetails(group.id)}
                        />
                        <FaEdit
                          className="action-icon edit-icon"
                          title="Edit Group"
                          onClick={() => handleEditClick(group.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingGroupId && (
          <UpdateGroupModal
            groupId={editingGroupId}
            onClose={handleCloseEditModal}
            onUpdated={fetchGroups}
            token={token}
          />
        )}

        {/* Details Modal */}
        {selectedGroupId && (
          <GroupDetailsModal
            groupId={selectedGroupId}
            token={token}
            onClose={handleCloseDetailsModal}
          />
        )}
      </div>
    </AdminLayout>
  );
}
