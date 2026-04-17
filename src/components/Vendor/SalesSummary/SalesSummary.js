import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import "./SalesSummary.css";
import * as XLSX from "xlsx";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

export default function StallSalesReportVendor() {
  const { stallIds, token } = useVendorAuth();

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("TODAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("AZ");

  const formatDate = (date) => date.toISOString().split("T")[0];

  /* DATE HELPERS */

  const getToday = useCallback(() => {
    const today = new Date();
    return [formatDate(today), formatDate(today)];
  }, []);

  const getWeek = useCallback(() => {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const start = new Date(today.setDate(first));
    const end = new Date();
    return [formatDate(start), formatDate(end)];
  }, []);

  const getMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();
    return [formatDate(start), formatDate(end)];
  }, []);

  const resolveDates = useCallback(() => {
    let start, end;

    if (dateFilter === "TODAY") [start, end] = getToday();
    if (dateFilter === "WEEK") [start, end] = getWeek();
    if (dateFilter === "MONTH") [start, end] = getMonth();

    if (dateFilter === "CUSTOM") {
      start = startDate;
      end = endDate;
    }

    return [start, end];
  }, [dateFilter, startDate, endDate, getToday, getWeek, getMonth]);

  /* FETCH SALES */

  const fetchSalesSummary = useCallback(async () => {
    if (!stallIds || stallIds.length === 0) return;

    const [start, end] = resolveDates();
    if (!start || !end) return;

    try {
      setLoading(true);

      const url =
        `${API_BASE}/orders/sales-summary/updated` +
        `?stall_ids=${stallIds.join(",")}` +
        `&start_date=${start}T00:00:00` +
        `&end_date=${end}T23:59:59`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      /* 🔥 NORMALIZE DATA HERE (MAIN FIX) */
      const normalized = (res.data?.stalls || []).map((s) => ({
        stall_id: s.stall_id,
        stall_name: s.stall_name,

        prepaid_net: s.prepaid_after_deduction || 0,
        prepaid_gross: s.prepaid_total_amount || 0,

        postpaid_net: s.postpaid_net_amount || 0,
        postpaid_gross: s.postpaid_total_amount || 0,
      }));

      setSalesData(normalized);

    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [stallIds, token, resolveDates]);

  useEffect(() => {
    fetchSalesSummary();
  }, [fetchSalesSummary]);

  /* SORT */

  const sortedSales = useMemo(() => {
    return [...salesData].sort((a, b) =>
      sortOrder === "AZ"
        ? a.stall_name.localeCompare(b.stall_name)
        : b.stall_name.localeCompare(a.stall_name)
    );
  }, [salesData, sortOrder]);

  /* TOTALS */

  const totals = useMemo(() => {
    return sortedSales.reduce(
      (acc, item) => {
        acc.prepaid_net += item.prepaid_net;
        acc.prepaid_gross += item.prepaid_gross;
        acc.postpaid_net += item.postpaid_net;
        acc.postpaid_gross += item.postpaid_gross;
        return acc;
      },
      {
        prepaid_net: 0,
        prepaid_gross: 0,
        postpaid_net: 0,
        postpaid_gross: 0,
      }
    );
  }, [sortedSales]);

  /* EXPORT */

  const exportExcel = () => {
    const data = sortedSales.map((s) => ({
      Outlet: s.stall_name,
      "Prepaid Net": s.prepaid_net,
      "Prepaid Gross": s.prepaid_gross,
      "Postpaid Net": s.postpaid_net,
      "Postpaid Gross": s.postpaid_gross,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");
    XLSX.writeFile(wb, "Outlet_Sales_Report.xlsx");
  };

  return (
    <div className="om-sales-container">
      <h2>Outlet Sales Summary</h2>

      <div className="om-top-bar">
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="TODAY">Today</option>
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="CUSTOM">Custom</option>
        </select>

        {dateFilter === "CUSTOM" && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}

        <button className="primary-btn" onClick={fetchSalesSummary}>
          Submit
        </button>
      </div>

      <div className="om-actions">
        <button onClick={() => setSortOrder("AZ")}>Sort A → Z</button>
        <button onClick={() => setSortOrder("ZA")}>Sort Z → A</button>
        <button onClick={exportExcel}>Export Excel</button>
      </div>

      {loading ? (
        <div className="om-loader"></div>
      ) : (
        <div className="om-table-wrapper">
          <table className="om-sales-table">
            <thead>
              <tr>
                <th>Outlet</th>
                <th>Prepaid Net</th>
                {/* <th>Prepaid Gross</th> */}
                <th>Postpaid Net</th>
                {/* <th>Postpaid Gross</th> */}
              </tr>
            </thead>
            <tbody>
              {sortedSales.map((stall, index) => (
                <tr key={index}>
                  <td>{stall.stall_name}</td>
                  <td>₹{stall.prepaid_net}</td>
                  {/* <td>₹{stall.prepaid_gross}</td> */}
                  <td>₹{stall.postpaid_net}</td>
                  {/* <td>₹{stall.postpaid_gross}</td> */}
                </tr>
              ))}

              <tr className="om-total-row">
                <td><b>Total</b></td>
                <td><b>₹{totals.prepaid_net.toFixed(2)}</b></td>
                {/* <td><b>₹{totals.prepaid_gross.toFixed(2)}</b></td> */}
                <td><b>₹{totals.postpaid_net.toFixed(2)}</b></td>
                {/* <td><b>₹{totals.postpaid_gross.toFixed(2)}</b></td> */}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}