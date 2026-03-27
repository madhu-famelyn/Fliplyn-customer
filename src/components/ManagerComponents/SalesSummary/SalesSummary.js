import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./SalesSummary.css";
import * as XLSX from "xlsx";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

const formatAmount = (value) => (!value ? 0 : Math.floor(value));

/* DATE FILTER */
const DateRangeFilter = ({ dateFilter, setDateFilter, startDate, setStartDate, endDate, setEndDate }) => (
  <div className="om-summary-filters">
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

/* TABLE */
const SalesTable = ({ data, type }) => (
  <div className="om-summary-table-wrapper">
    <table className="om-summary-table">
      <thead>
        <tr>
          <th className="col-outlet">Outlet</th>

          {type === "stall" ? (
            <>
              <th>Prepaid Net</th>
              <th>Prepaid Total</th>
              <th>Postpaid Net</th>
              <th>Postpaid Total</th>
            </>
          ) : (
            <>
              <th>Postpaid Net</th>
              <th>Postpaid Total</th>
            </>
          )}
        </tr>
      </thead>

      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td className="col-outlet">{item.outlet || item.stall_name}</td>

            {type === "stall" ? (
              <>
                <td>₹{formatAmount(item.prepaid_after_deduction)}</td>
                <td>₹{formatAmount(item.prepaid_total_amount)}</td>
                <td>₹{formatAmount(item.postpaid_net_amount)}</td>
                <td>₹{formatAmount(item.postpaid_total_amount)}</td>
              </>
            ) : (
              <>
                <td>₹{formatAmount(item.postpaid_net)}</td>
                <td>₹{formatAmount(item.postpaid_total)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function SalesSummary() {

  const { user } = useAuth();

  const [stalls, setStalls] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");

  const [mode, setMode] = useState("stall");

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("TODAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatDate = (date) => date.toISOString().split("T")[0];

  /* LOAD COMPANY DOMAINS */
  useEffect(() => {

    axios.get(`${API_BASE}/company-domains/`)
      .then(res => setCompanies(res.data || []))
      .catch(err => console.error(err));

  }, []);

  /* FETCH STALLS */
  useEffect(() => {

    if (!user?.building_id) return;

    axios.get(`${API_BASE}/stalls/building/${user.building_id}`)
      .then(res => setStalls(res.data || []))
      .catch(err => console.error(err));

  }, [user]);

  const resolveDates = useCallback(() => {

    const today = new Date();

    if (dateFilter === "TODAY") {
      const d = formatDate(today);
      return [d, d];
    }

    if (dateFilter === "WEEK") {
      const first = today.getDate() - today.getDay();
      return [formatDate(new Date(today.setDate(first))), formatDate(new Date())];
    }

    if (dateFilter === "MONTH") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return [formatDate(start), formatDate(new Date())];
    }

    return [startDate, endDate];

  }, [dateFilter, startDate, endDate]);

  const fetchData = async () => {

    const [start, end] = resolveDates();

    if (!start || !end) return alert("Select date range");

    setLoading(true);

    try {

      /* COMPANY SALES SUMMARY */
      if (selectedCompany) {

        const res = await axios.get(
          `${API_BASE}/company-sales-summary/?company=${selectedCompany}&start_date=${start}&end_date=${end}`
        );

        setSalesData(res.data || []);
        setMode("company");

      } else {

        /* ALL STALLS SALES SUMMARY (UNCHANGED LOGIC) */

        const stallIds = stalls.map(s => s.id || s.stall_id).join(",");

        const res = await axios.get(
          `${API_BASE}/orders/sales-summary/updated?stall_ids=${stallIds}&start_date=${start}T00:00:00&end_date=${end}T23:59:59`
        );

        setSalesData(res.data?.stalls || []);
        setMode("stall");

      }

    } catch (err) {
      console.error(err);
    }

    setLoading(false);

  };

  const exportExcel = () => {

    const data = salesData.map((s) => ({
      Outlet: s.outlet || s.stall_name,
      "Postpaid Net": formatAmount(s.postpaid_net || s.postpaid_net_amount),
      "Postpaid Total": formatAmount(s.postpaid_total || s.postpaid_total_amount),
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Sales");

    XLSX.writeFile(wb, "Sales_Report.xlsx");

  };

  return (

    <div className="om-summary-container">

      <h2 className="om-summary-title">Sales Summary</h2>

      <div className="om-summary-header">

        <div className="om-summary-left">

          {/* COMPANY DROPDOWN */}

          <select
            className="om-summary-select"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">All Stalls</option>

            {companies.map((c, index) => (
              <option key={index} value={c}>
                {c}
              </option>
            ))}
          </select>

          <DateRangeFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />

          <button className="om-summary-export" onClick={exportExcel}>
            Export Excel
          </button>

        </div>

        <button className="om-summary-btn" onClick={fetchData}>
          Submit
        </button>

      </div>

      {loading
        ? <div className="om-summary-loader"></div>
        : <SalesTable data={salesData} type={mode} />
      }

    </div>
  );
}