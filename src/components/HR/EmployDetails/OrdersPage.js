import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useHrAuth } from "../../AuthContex/HrContext";
import "./OrderPage.css";

const API_BASE = "https://admin-aged-field-2794.fly.dev"; // ⚠️ Match your backend

const OrdersModal = ({ groupId, onClose }) => {
  const { token } = useHrAuth();

  const [period, setPeriod] = useState("today");
  const [salesData, setSalesData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ================= DATE RANGE ================= */

  const getDateRange = () => {
    const today = new Date();
    let startDate;
    const endDate = today.toISOString().split("T")[0];

    if (period === "today") {
      startDate = endDate;
    }

    if (period === "week") {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      startDate = firstDay.toISOString().split("T")[0];
    }

    if (period === "month") {
      const firstDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      startDate = firstDay.toISOString().split("T")[0];
    }

    return { startDate, endDate };
  };

  /* ================= FETCH ================= */

  const fetchSalesSummary = async () => {
    if (!groupId) return;

    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange();

      const url = `${API_BASE}/wallet-group/${groupId}/sales-summary/?start_date=${startDate}&end_date=${endDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        setSalesData([]);
        setGrandTotal(null);
        return;
      }

      // Separate total row from outlet rows
      const outletRows = data.filter(
        (row) => row.outlet !== "Total"
      );

      const totalRow = data.find(
        (row) => row.outlet === "Total"
      );

      setSalesData(outletRows);
      setGrandTotal(totalRow || null);

    } catch (err) {
      console.error("Sales summary error:", err);
      setSalesData([]);
      setGrandTotal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    await fetchSalesSummary();
  };

  /* ================= EXPORT ================= */

  const exportToExcel = () => {
    if (!salesData.length) return;

    const rows = salesData.map((o) => ({
      Outlet: o.outlet,
      "Postpaid Net (₹)": Number(o.postpaid_net || 0).toFixed(2),
      "Postpaid Gross (₹)": Number(o.postpaid_gross || 0).toFixed(2),
    }));

    if (grandTotal) {
      rows.push({
        Outlet: "Total",
        "Postpaid Net (₹)": Number(grandTotal.postpaid_net).toFixed(2),
        "Postpaid Gross (₹)": Number(grandTotal.postpaid_gross).toFixed(2),
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");
    XLSX.writeFile(wb, "wallet_group_sales_summary.xlsx");
  };

  /* ================= UI ================= */

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <h2>Wallet Group Sales Summary</h2>

        <div className="filter-section">
          <div>
            <label>Select Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            Load Report
          </button>
        </div>

        {loading && <p>Loading sales summary...</p>}

        {!loading && submitted && salesData.length > 0 && (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Postpaid Gross (₹)</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.outlet}</td>
                    <td>₹{Number(row.postpaid_gross).toFixed(2)}</td>
                  </tr>
                ))}

                {grandTotal && (
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td><strong>₹{Number(grandTotal.postpaid_gross).toFixed(2)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="total-section">
              <button onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>
          </>
        )}

        {!loading && submitted && salesData.length === 0 && (
          <p>No sales data found for this period.</p>
        )}
      </div>
    </div>
  );
};

export default OrdersModal;