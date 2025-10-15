import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useHrAuth } from "../../AuthContex/HrContext";
import { updateUserStatus } from "../../Service";
import Layout from "../SideBar/Layout";
import AddMemberModal from "./AddMemberModel";
import UpdateExcelModal from "./UpdateExcelModal";
import { getWalletGroupsByHrId } from "../Dashboard/Service";
import OrdersModal from "./OrdersPage";
import {
  AiOutlineHistory,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlinePlus,
} from "react-icons/ai";
import "./EmployeDetails.css";

const EmployeesPage = () => {
  const { groupId } = useParams();
  const { hr, token } = useHrAuth();
  const [employees, setEmployees] = useState([]);
  const [group, setGroup] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Normalize phone numbers
  const normalizeUsers = (users) =>
    (users || []).map((u) => ({ ...u, phone: u.phone || u.mobile_number }));

  // Fetch group & employee details
  useEffect(() => {
    const fetchEmployees = async () => {
      if (hr?.id && token) {
        try {
          setLoading(true);
          const groups = await getWalletGroupsByHrId(hr.id, token);
          const foundGroup = groups.find(
            (g) => g.id.toString() === groupId
          );
          setGroup(foundGroup || null);
          setEmployees(normalizeUsers(foundGroup?.users || []));
        } catch (err) {
          console.error("❌ Failed to fetch employees:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [hr, token, groupId]);

  // Render tick or cross for booleans
  const renderTick = (value) =>
    value ? (
      <AiOutlineCheck color="green" size={18} />
    ) : (
      <AiOutlineClose color="red" size={18} />
    );

  // Handle when group is updated
  const handleGroupUpdated = (updatedGroup) => {
    setGroup(updatedGroup);
    setEmployees(normalizeUsers(updatedGroup.user_info || updatedGroup.users || []));
  };

  // Toggle employee active/inactive status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const confirmMsg = `Are you sure you want to ${
      currentStatus ? "deactivate" : "activate"
    } this user?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await updateUserStatus(groupId, userId, !currentStatus, token);
      if (response.data.user_info) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.user_id === userId ? { ...emp, is_active: !currentStatus } : emp
          )
        );
      }
    } catch (err) {
      console.error("Failed to update user status:", err.response?.data?.detail || err.message);
      alert(err.response?.data?.detail || "Failed to update user status");
    }
  };

  // Show order history modal
 const handleGetOrderHistory = () => {
  console.log("📦 Opening OrdersModal for group:", groupId);
  setShowOrdersModal(true);
};


  return (
    <Layout>
      <div className="employees-page-container">
        {/* Loader */}
        {loading ? (
          <div className="loader-wrapper">
            <div className="loader"></div>
            <p>Loading employees...</p>
          </div>
        ) : (
          <>
            {group ? (
              <>
                {/* Group Info */}
                <h2 className="employees-page-group-name">
                  Group: {group.group_name}
                </h2>

                <div className="employees-page-wallet-info">
                  <p>
                    <strong>Wallet Amount:</strong> ₹{group.wallet_amount}
                  </p>
                  <p>
                    <strong>Carry Forward:</strong> {renderTick(group.carry_forward)}
                  </p>
                  <p>
                    <strong>Exclude Weekend:</strong> {renderTick(group.exclude_weekend)}
                  </p>
                  <p>
                    <strong>Daily Wallet:</strong> {renderTick(group.daily_wallet)}
                  </p>
                </div>

                {/* Header Buttons */}
                <div className="employees-page-header">
                  <h3 className="employees-page-header-title">
                    Employees in Group
                  </h3>
                  <div className="employees-page-header-buttons">
                    <button
                      className="btn-add"
                      onClick={() => setShowAddModal(true)}
                    >
                      <AiOutlinePlus size={16} className="btn-icon" /> Add Member
                    </button>
                        <button className="btn-add" onClick={handleGetOrderHistory}>
                          <AiOutlineHistory size={16} className="btn-icon" /> Order History
                        </button>
                  </div>
                </div>

                {/* Employee Table */}
                {employees.length > 0 ? (
                  <div className="employees-table-wrapper">
                    <table className="employees-page-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => (
                          <tr key={emp.user_id}>
                            <td>{emp.name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.phone}</td>
                            <td>
                              <span
                                style={{
                                  color: emp.is_active ? "green" : "red",
                                  fontWeight: "bold",
                                }}
                              >
                                {emp.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="status-toggle-btn"
                                style={{
                                  backgroundColor: emp.is_active ? "#cc0000" : "#007bff",
                                }}
                                onClick={() =>
                                  handleToggleUserStatus(emp.user_id, emp.is_active)
                                }
                              >
                                {emp.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="employees-page-no-employees">
                    No employees found in this group.
                  </p>
                )}
              </>
            ) : (
              <p className="employees-page-no-employees">No group found.</p>
            )}
          </>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddMemberModal
            groupId={groupId}
            token={token}
            onClose={() => setShowAddModal(false)}
            onMemberAdded={handleGroupUpdated}
          />
        )}

        {showExcelModal && (
          <UpdateExcelModal
            groupId={groupId}
            token={token}
            onClose={() => setShowExcelModal(false)}
            onGroupUpdated={handleGroupUpdated}
          />
        )}

        {showOrdersModal && (
          <OrdersModal
            groupId={groupId}  // ✅ Pass groupId here
            userIds={employees.map((emp) => emp.user_id)}
            onClose={() => setShowOrdersModal(false)}
          />
        )}

      </div>
    </Layout>
  );
};

export default EmployeesPage;
