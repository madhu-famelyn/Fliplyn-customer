// components/Reports/Reports.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHrAuth } from "../../AuthContex/HrContext";

export default function Reports() {
  const { hr, token } = useHrAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!hr?.id) return;
      try {
        setLoading(true);

        // Step 1: Get HR wallet groups & users
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/hr/get-wallet/${hr.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const groups = res.data?.[0] || {};
        const allUsers = groups.users || [];

        // Step 2: For each user fetch wallet + history
        const allRows = await Promise.all(
          allUsers.map(async (user) => {
            try {
              const walletRes = await axios.get(
                `https://admin-aged-field-2794.fly.dev/wallets/${user.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const wallet = walletRes.data;

              const historyRes = await axios.get(
                `https://admin-aged-field-2794.fly.dev/wallets/${user.user_id}/history`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const history = historyRes.data || [];

              // ✅ Process history into row-by-row transactions
              let walletDeposited = 0;
              let walletUsed = 0;
              let balance = 0;

              const userRows = history.map((h) => {
                if (h.amount > 0) {
                  // deposit
                  walletDeposited = h.amount;
                  walletUsed = 0;
                  balance = walletDeposited;
                } else {
                  // usage
                  walletUsed += Math.abs(h.amount);
                  balance = walletDeposited - walletUsed;
                }

                return {
                  employee: user.name,
                  walletDeposited,
                  walletUsed,
                  balance,
                  date: h.date,
                  amount: h.amount,
                };
              });

              return userRows;
            } catch (err) {
              console.error(`Failed to fetch wallet for ${user.name}`, err);
              return [];
            }
          })
        );

        // Flatten nested arrays
        setRows(allRows.flat());
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [hr, token]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Employee Wallet Reports</h2>
      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={thStyle}>Employee</th>
              <th style={thStyle}>Wallet Deposited</th>
              <th style={thStyle}>Wallet Used</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{r.employee}</td>
                <td style={tdStyle}>{r.walletDeposited}</td>
                <td style={tdStyle}>{r.walletUsed}</td>
                <td style={tdStyle}>{r.balance}</td>
                <td style={tdStyle}>
                  {r.date ? new Date(r.date).toLocaleString() : "-"}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    color: r.amount < 0 ? "red" : "green",
                  }}
                >
                  {r.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};
