import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useBuildingManagerAuth } from "../AuthContex/BuildingManagerContext";
import "./ReportSummary.css";
import * as XLSX from "xlsx";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

export default function StallSalesReportBMSummary() {
  const { manager, token } = useBuildingManagerAuth();

  const [stalls, setStalls] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("TODAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("AZ");

  /* ================= DATE HELPERS ================= */

  const formatDate = (date) => date.toISOString().split("T")[0];

  const resolveDates = () => {
    const today = new Date();
    let start, end;

    switch (dateFilter) {
      case "TODAY":
        start = formatDate(today);
        end = formatDate(today);
        break;

      case "WEEK":
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay());
        start = formatDate(firstDay);
        end = formatDate(today);
        break;

      case "MONTH":
        const now = new Date();
        start = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
        end = formatDate(now);
        break;

      case "CUSTOM":
        if (!startDate || !endDate) return [];
        start = startDate;
        end = endDate;
        break;

      default:
        return [];
    }

    return [start, end];
  };

  /* ================= FETCH STALLS ================= */

  useEffect(() => {
    if (!manager?.building_id || !token) return;

    const fetchStalls = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/stalls/building/${manager.building_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (Array.isArray(res.data)) {
          setStalls(res.data);
        }
      } catch (err) {
        console.error("Stall fetch error:", err.response?.data || err.message);
      }
    };

    fetchStalls();
  }, [manager, token]);

  /* ================= FETCH SALES SUMMARY ================= */

  const fetchSalesSummary = async () => {
    if (!stalls.length) return;

    const [start, end] = resolveDates();
    if (!start || !end) {
      alert("Please select valid date range");
      return;
    }

    try {
      setLoading(true);

      const stallIds = stalls
        .map((s) => s.id || s.stall_id)
        .filter(Boolean);

      const res = await axios.get(
        `${API_BASE}/orders/sales-summary/updated`,
        {
          params: {
            stall_ids: stallIds.join(","),
            start_date: `${start}T00:00:00`,
            end_date: `${end}T23:59:59`,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.data?.stalls) {
        setSalesData([]);
        setGrandTotals(null);
        return;
      }

      setSalesData(res.data.stalls);

      setGrandTotals({
        prepaid_after: res.data.grand_prepaid_net_after_deduction,
        prepaid_gross: res.data.grand_prepaid_gross_amount,
        postpaid_net: res.data.grand_postpaid_net_amount,
        postpaid_gross: res.data.grand_postpaid_gross_amount,
      });
    } catch (err) {
      console.error("Summary API error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SORT ================= */

  const sortedSales = useMemo(() => {
    return [...salesData].sort((a, b) => {
      const nameA = a.stall_name || "";
      const nameB = b.stall_name || "";

      return sortOrder === "AZ"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [salesData, sortOrder]);

  /* ================= EXPORT ================= */

  const exportExcel = () => {
    if (!sortedSales.length) return;

    const data = sortedSales.map((s) => ({
      Outlet: s.stall_name,
      "Prepaid Net": s.prepaid_net_after_deduction || 0,
      "Prepaid Gross": s.prepaid_gross_amount || 0,
      "Postpaid Net": s.postpaid_net_amount || 0,
      "Postpaid Gross": s.postpaid_gross_amount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");
    XLSX.writeFile(wb, "Outlet_Sales_Report_BM.xlsx");
  };

  /* ================= UI ================= */

  return (
    <div className="om-sales-container">
      <h2>Outlet Sales Summary (Building Manager)</h2>

      <div className="om-top-bar">

        {/* DATE FILTER */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="TODAY">Today</option>
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="CUSTOM">Custom Range</option>
        </select>
        <button onClick={fetchSalesSummary} className="primary-btn">
          Submit
        </button>

        {/* CUSTOM DATE INPUTS */}
        {dateFilter === "CUSTOM" && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </>
        )}

        
      </div>

      <div className="om-actions">
        <button onClick={() => setSortOrder("AZ")}>Sort A → Z</button>
        <button onClick={() => setSortOrder("ZA")}>Sort Z → A</button>
        <button onClick={exportExcel}>Export Excel</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div class="om-table-wrapper">

        <table className="om-sales-table">
          <thead>
            <tr>
              <th>Outlet</th>
              <th>Prepaid Net</th>
              <th>Prepaid Gross</th>
              <th>Postpaid Net</th>
              <th>Postpaid Gross</th>
            </tr>
          </thead>
          <tbody>
            {sortedSales.map((stall, index) => (
              <tr key={index}>
                <td>{stall.stall_name}</td>
                <td>₹{stall.prepaid_net_after_deduction || 0}</td>
                <td>₹{stall.prepaid_gross_amount || 0}</td>
                <td>₹{stall.postpaid_net_amount || 0}</td>
                <td>₹{stall.postpaid_gross_amount || 0}</td>
              </tr>
            ))}

            {grandTotals && (
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td><strong>₹{grandTotals.prepaid_after}</strong></td>
                <td><strong>₹{grandTotals.prepaid_gross}</strong></td>
                <td><strong>₹{grandTotals.postpaid_net}</strong></td>
                <td><strong>₹{grandTotals.postpaid_gross}</strong></td>
              </tr>
            )}
          </tbody>
        </table>
         </div>
      )}
    </div>
  );
}