import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ for navigation
import Layout from "../SideBar/Layout";
import { useHrAuth } from "../../AuthContex/HrContext";
import { getWalletGroupsByHrId } from "./Service";
import "./Dashboard.css";

const Dashboard = () => {
  const { hr, token } = useHrAuth();
  const [walletGroups, setWalletGroups] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch wallet groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (hr?.id && token) {
        const groups = await getWalletGroupsByHrId(hr.id, token);
        setWalletGroups(groups);
      }
    };
    fetchGroups();
  }, [hr, token]);

  const handleCardClick = (groupId) => {
    navigate(`/wallet-group/${groupId}`);
  };

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="dashboard-title">HR Dashboard</h2>
          <div className="company-info">
            <p className="name">{hr?.name || "HR Name"}</p>
            <p className="company-role">HR</p>
          </div>
        </div>

        {/* Wallet Groups Section */}
        {walletGroups.length > 0 ? (
          <div className="wallet-cards">
            {walletGroups.map((group) => (
              <div
                className="wallet-card"
                key={group.id}
                onClick={() => handleCardClick(group.id)} // ✅ navigate
                style={{ cursor: "pointer" }}
              >
                <p className="group-name">{group.group_name}</p>
                <span className="users-count">
                  {group.users?.length || 0} Users
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-wallets">No wallet groups found</p>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
