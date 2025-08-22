import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useHrAuth } from "../../AuthContex/HrContext";
import { getWalletGroupsByHrId } from "../Dashboard/Service";
import Layout from "../SideBar/Layout";
import AddMemberModal from "./AddMemberModel";
import UpdateExcelModal from "./UpdateExcelModal";
import OrdersModal from "./OrdersPage";
import { AiOutlineHistory } from "react-icons/ai";
import axios from "axios";
import {
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlinePlus,
  AiOutlineDelete,
} from "react-icons/ai";
import "./EmployeDetails.css";

const EmployeesPage = () => {
  const { groupId } = useParams();
  const { hr, token } = useHrAuth();
  const [employees, setEmployees] = useState([]);
  const [group, setGroup] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false); // new modal state

  // normalize user list so "phone" is always available
  const normalizeUsers = (users) =>
    (users || []).map((u) => ({
      ...u,
      phone: u.phone || u.mobile_number,
    }));

  useEffect(() => {
    const fetchEmployees = async () => {
      if (hr?.id && token) {
        const groups = await getWalletGroupsByHrId(hr.id, token);
        const foundGroup = groups.find((g) => g.id.toString() === groupId);
        setGroup(foundGroup || null);
        setEmployees(normalizeUsers(foundGroup?.users || []));
      }
    };
    fetchEmployees();
  }, [hr, token, groupId]);

  const renderTick = (value) =>
    value ? <AiOutlineCheck color="green" size={18} /> : <AiOutlineClose color="red" size={18} />;

  const handleGroupUpdated = (updatedGroup) => {
    setGroup(updatedGroup);
    setEmployees(normalizeUsers(updatedGroup.user_info || updatedGroup.users || []));
  };

  const handleDeleteUser = async (mobile_number) => {
    if (!window.confirm(`Are you sure you want to remove user ${mobile_number}?`)) return;

    try {
      const response = await axios.delete(
        `http://localhost:8000/${groupId}/remove-member`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { mobile_number },
        }
      );
      if (response.data.wallet_group) {
        handleGroupUpdated(response.data.wallet_group);
      }
    } catch (err) {
      console.error("Failed to delete user:", err.response?.data?.detail || err.message);
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleGetOrderHistory = () => {
    setShowOrdersModal(true); // open modal instead of navigate
  };

  return (
    <Layout>
      <div className="employees-page-container">
        {group && (
          <>
            <h2 className="employees-page-group-name">Group: {group.group_name}</h2>

            <div className="employees-page-wallet-info">
              <p><strong>Wallet Amount:</strong> {group.wallet_amount}</p>
              <p><strong>Carry Forward:</strong> {renderTick(group.carry_forward)}</p>
              <p><strong>Exclude Weekend:</strong> {renderTick(group.exclude_weekend)}</p>
              <p><strong>Daily Wallet:</strong> {renderTick(group.daily_wallet)}</p>
            </div>

            <div className="employees-page-header">
              <h3 className="employees-page-header-title">Employees in Group</h3>
              <div className="employees-page-header-buttons">
                <button className="btn-add" onClick={() => setShowAddModal(true)}>
                  <AiOutlinePlus size={16} className="btn-icon" /> Add Member Manually
                </button>

                <button className="btn-add" onClick={handleGetOrderHistory}>
                  <AiOutlineHistory size={16} className="btn-icon" /> Get Order History
                </button>
              </div>
            </div>

            {employees.length > 0 ? (
              <table className="employees-page-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
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
                        <button
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#cc4e00ff",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "14px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeleteUser(emp.phone)}
                        >
                          <AiOutlineDelete size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="employees-page-no-employees">No employees found in this group.</p>
            )}
          </>
        )}

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
            userIds={employees.map((emp) => emp.user_id)}
            onClose={() => setShowOrdersModal(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default EmployeesPage;
