import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./SalesSummary.css";
import * as XLSX from "xlsx";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

const DateRangeFilter = ({ dateFilter, setDateFilter, startDate, setStartDate, endDate, setEndDate }) => (
  <div className="om-filters-om">
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
  </div>
);

const SalesTable = ({ salesData, totals }) => (
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
      {salesData.map((stall, index) => (
        <tr key={index}>
          <td>{stall.stall_name}</td>
          <td>₹{stall.prepaid_net_after_deduction || 0}</td>
          <td>₹{stall.prepaid_gross_amount || 0}</td>
          <td>₹{stall.postpaid_net_amount || 0}</td>
          <td>₹{stall.postpaid_gross_amount || 0}</td>
        </tr>
      ))}

      <tr className="om-total-row">
        <td><b>Total</b></td>
        <td><b>₹{totals.prepaid_after.toFixed(2)}</b></td>
        <td><b>₹{totals.prepaid_gross.toFixed(2)}</b></td>
        <td><b>₹{totals.postpaid_net.toFixed(2)}</b></td>
        <td><b>₹{totals.postpaid_gross.toFixed(2)}</b></td>
      </tr>
    </tbody>
  </table>
);

export default function StallSalesReportOM() {

  const { user } = useAuth();

  const [stalls, setStalls] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("TODAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sortOrder, setSortOrder] = useState("AZ");

  const formatDate = (date) => date.toISOString().split("T")[0];

  /* FETCH STALLS */

  useEffect(() => {

    if (!user?.building_id) return;

    const fetchStalls = async () => {
      try {

        const res = await axios.get(`${API_BASE}/stalls/building/${user.building_id}`);

        if (!Array.isArray(res.data)) return;

        setStalls(res.data);

      } catch (err) {
        console.error("Failed to fetch stalls:", err);
      }
    };

    fetchStalls();

  }, [user]);

  /* DATE RESOLVER */

  const resolveDates = useCallback(() => {

    const getToday = () => {
      const today = new Date();
      return [formatDate(today), formatDate(today)];
    };

    const getWeek = () => {
      const today = new Date();
      const first = today.getDate() - today.getDay();
      const start = new Date(today.setDate(first));
      const end = new Date();
      return [formatDate(start), formatDate(end)];
    };

    const getMonth = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      return [formatDate(start), formatDate(end)];
    };

    let start;
    let end;

    if (dateFilter === "TODAY") [start, end] = getToday();
    if (dateFilter === "WEEK") [start, end] = getWeek();
    if (dateFilter === "MONTH") [start, end] = getMonth();

    if (dateFilter === "CUSTOM") {
      start = startDate;
      end = endDate;
    }

    return [start, end];

  }, [dateFilter, startDate, endDate]);

  /* FETCH SALES */

  const fetchSalesSummary = useCallback(async () => {

    try {

      if (!stalls.length) return;

      const [start, end] = resolveDates();

      if (!start || !end) {
        alert("Please select date range");
        return;
      }

      setLoading(true);

      const stallIds = stalls
        .map((s) => s.id || s.stall_id)
        .filter(Boolean)
        .join(",");

      const url =
        `${API_BASE}/orders/sales-summary/updated` +
        `?stall_ids=${stallIds}` +
        `&start_date=${start}T00:00:00` +
        `&end_date=${end}T23:59:59`;

      const res = await axios.get(url);

      if (!res.data || !res.data.stalls) {
        setSalesData([]);
        return;
      }

      setSalesData(res.data.stalls);

    } catch (err) {

      console.error("Sales summary error:", err);

    } finally {

      setLoading(false);

    }

  }, [stalls, resolveDates]);

  /* SORT */

  const sortedSales = useMemo(() => {

    const sorted = [...salesData].sort((a, b) => {

      if (sortOrder === "AZ") return a.stall_name.localeCompare(b.stall_name);

      return b.stall_name.localeCompare(a.stall_name);

    });

    return sorted;

  }, [salesData, sortOrder]);

  /* TOTALS */

  const totals = useMemo(() => {

    return sortedSales.reduce((acc, item) => {

      acc.prepaid_after += item.prepaid_net_after_deduction || 0;
      acc.prepaid_gross += item.prepaid_gross_amount || 0;
      acc.postpaid_net += item.postpaid_net_amount || 0;
      acc.postpaid_gross += item.postpaid_gross_amount || 0;

      return acc;

    }, {
      prepaid_after: 0,
      prepaid_gross: 0,
      postpaid_net: 0,
      postpaid_gross: 0
    });

  }, [sortedSales]);

  /* EXPORT */

  const exportExcel = () => {

    const data = sortedSales.map((s) => ({
      Outlet: s.stall_name,
      "Prepaid Net": s.prepaid_net_after_deduction,
      "Prepaid Gross": s.prepaid_gross_amount,
      "Postpaid Net": s.postpaid_net_amount,
      "Postpaid Gross": s.postpaid_gross_amount,
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

        <DateRangeFilter
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        <button className="primary-btn" onClick={fetchSalesSummary}>
          Submit
        </button>

      </div>

      <div className="om-actions">

        <button onClick={() => setSortOrder("AZ")}>Sort A → Z</button>
        <button onClick={() => setSortOrder("ZA")}>Sort Z → A</button>
        <button onClick={exportExcel}>Export Excel</button>

      </div>

      {loading
        ? <div className="om-loader"></div>
        : <SalesTable salesData={sortedSales} totals={totals} />
      }

    </div>
  );
}