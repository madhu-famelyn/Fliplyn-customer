import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./SalesSummary.css";
import * as XLSX from "xlsx";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

const formatAmount = (value) => (!value ? 0 : Math.floor(value));

/* ── DATE FILTER ── */
const DateRangeFilter = ({ dateFilter, setDateFilter, startDate, setStartDate, endDate, setEndDate }) => (
  <div className="om-summary-filters">
    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
      <option value="TODAY">Today</option>
      <option value="WEEK">This Week</option>
      <option value="MONTH">This Month</option>
      <option value="CUSTOM">Custom Range</option>
    </select>

    {dateFilter === "CUSTOM" && (
      <>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate}   onChange={(e) => setEndDate(e.target.value)}   />
      </>
    )}
  </div>
);

/* ── STAT CARDS ── */
const StatsStrip = ({ data, mode }) => {
  const totals = data.reduce(
    (acc, item) => {
      if (mode === "stall") {
        acc.prepaidNet   += Number(item.prepaid_after_deduction || 0);
        acc.prepaidTotal += Number(item.prepaid_total_amount    || 0);
      }
      acc.postpaidNet   += Number(item.postpaid_net   || item.postpaid_net_amount   || 0);
      acc.postpaidTotal += Number(item.postpaid_total || item.postpaid_total_amount || 0);
      return acc;
    },
    { prepaidNet: 0, prepaidTotal: 0, postpaidNet: 0, postpaidTotal: 0 }
  );

  const cards =
    mode === "stall"
      ? [
          { label: "Prepaid Net",    value: totals.prepaidNet,   icon: "💳" },
          { label: "Prepaid Total",  value: totals.prepaidTotal, icon: "🧾" },
          { label: "Postpaid Net",   value: totals.postpaidNet,  icon: "📦" },
          { label: "Postpaid Total", value: totals.postpaidTotal,icon: "💰" },
        ]
      : [
          { label: "Postpaid Net",   value: totals.postpaidNet,  icon: "📦" },
          { label: "Postpaid Total", value: totals.postpaidTotal,icon: "💰" },
          { label: "Outlets",        value: data.length,         icon: "🏪", raw: true },
        ];

  return (
    <div className="om-summary-stats-strip">
      {cards.map((card) => (
        <div className="om-summary-stat-card" key={card.label}>
          <div className="om-summary-stat-label">{card.label}</div>
          <div className="om-summary-stat-value">
            {card.raw ? card.value : `₹${formatAmount(card.value).toLocaleString("en-IN")}`}
          </div>
          <span className="om-summary-stat-icon">{card.icon}</span>
        </div>
      ))}
    </div>
  );
};

/* ── SALES TABLE ── */
const SalesTable = ({ data, type }) => {
  // Filter out any "Total" rows from the data
  const filteredData = data.filter(item => (item.outlet || item.stall_name) !== "Total");
  
  const totals = filteredData.reduce(
    (acc, item) => {
      if (type === "stall") {
        acc.prepaidNet   += Number(item.prepaid_after_deduction || 0);
        acc.prepaidTotal += Number(item.prepaid_total_amount    || 0);
        acc.postpaidNet  += Number(item.postpaid_net_amount || item.postpaid_net || 0);
        acc.postpaidTotal+= Number(item.postpaid_total_amount || item.postpaid_total || 0);
      } else {
        acc.postpaidNet  += Number(item.postpaid_net || item.postpaid_net_amount   || 0);
        acc.postpaidTotal+= Number(item.postpaid_total || item.postpaid_total_amount || 0);
      }
      return acc;
    },
    { prepaidNet: 0, prepaidTotal: 0, postpaidNet: 0, postpaidTotal: 0 }
  );

  if (filteredData.length === 0) {
    return (
      <div className="om-summary-empty">
        <div className="om-summary-empty-icon">📊</div>
        <div className="om-summary-empty-text">No data to display</div>
        <div className="om-summary-empty-hint">Select filters and click Submit to load sales data</div>
      </div>
    );
  }

  const AmountCell = ({ value }) => (
    <span className="om-summary-amount">
      <span className="om-summary-currency">₹</span>
      {formatAmount(value).toLocaleString("en-IN")}
    </span>
  );

  return (
    <div className="om-summary-table-card">
      {/* Header bar */}
      <div className="om-summary-table-header-bar">
        <div className="om-summary-table-title">
          📋 Sales Report
        </div>
        <span className="om-summary-row-count">{filteredData.length} {filteredData.length === 1 ? "outlet" : "outlets"}</span>
      </div>

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
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td className="col-outlet">{item.outlet || item.stall_name}</td>

                {type === "stall" ? (
                  <>
                    <td><AmountCell value={item.prepaid_after_deduction} /></td>
                    <td><AmountCell value={item.prepaid_total_amount}    /></td>
                    <td><AmountCell value={item.postpaid_net_amount}     /></td>
                    <td><AmountCell value={item.postpaid_total_amount}   /></td>
                  </>
                ) : (
                  <>
                    <td><AmountCell value={item.postpaid_net}   /></td>
                    <td><AmountCell value={item.postpaid_total} /></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="om-summary-total-row">
              <td className="col-outlet">
                Total <span className="om-summary-total-badge">sum</span>
              </td>

              {type === "stall" ? (
                <>
                  <td><AmountCell value={totals.prepaidNet}    /></td>
                  <td><AmountCell value={totals.prepaidTotal}  /></td>
                  <td><AmountCell value={totals.postpaidNet}   /></td>
                  <td><AmountCell value={totals.postpaidTotal} /></td>
                </>
              ) : (
                <>
                  <td><AmountCell value={totals.postpaidNet}   /></td>
                  <td><AmountCell value={totals.postpaidTotal} /></td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ── MAIN COMPONENT ── */
export default function SalesSummary() {
  const { user } = useAuth();

  const [stalls,          setStalls]          = useState([]);
  const [companies,       setCompanies]       = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [mode,            setMode]            = useState("stall");
  const [salesData,       setSalesData]       = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [dateFilter,      setDateFilter]      = useState("TODAY");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");

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
      if (selectedCompany) {
        const res = await axios.get(
          `${API_BASE}/company-sales-summary/?company=${selectedCompany}&start_date=${start}&end_date=${end}`
        );
        setSalesData(res.data || []);
        setMode("company");
      } else {
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
    // Filter out any "Total" rows from the API response
    const filteredSalesData = salesData.filter(item => (item.outlet || item.stall_name) !== "Total");
    let data;

    if (mode === "stall") {
      data = filteredSalesData.map((s) => ({
        Outlet:          s.outlet || s.stall_name,
        "Prepaid Net":   formatAmount(s.prepaid_after_deduction),
        "Prepaid Total": formatAmount(s.prepaid_total_amount),
        "Postpaid Net":  formatAmount(s.postpaid_net || s.postpaid_net_amount),
        "Postpaid Total":formatAmount(s.postpaid_total || s.postpaid_total_amount),
      }));
      const tPrepaidNet   = filteredSalesData.reduce((a, s) => a + Number(s.prepaid_after_deduction || 0), 0);
      const tPrepaidTotal = filteredSalesData.reduce((a, s) => a + Number(s.prepaid_total_amount    || 0), 0);
      const tPostNet      = filteredSalesData.reduce((a, s) => a + Number(s.postpaid_net || s.postpaid_net_amount   || 0), 0);
      const tPostTotal    = filteredSalesData.reduce((a, s) => a + Number(s.postpaid_total || s.postpaid_total_amount || 0), 0);
      data.push({ Outlet: "Total", "Prepaid Net": formatAmount(tPrepaidNet), "Prepaid Total": formatAmount(tPrepaidTotal), "Postpaid Net": formatAmount(tPostNet), "Postpaid Total": formatAmount(tPostTotal) });
    } else {
      data = filteredSalesData.map((s) => ({
        Outlet:           s.outlet || s.stall_name,
        "Postpaid Net":   formatAmount(s.postpaid_net || s.postpaid_net_amount),
        "Postpaid Total": formatAmount(s.postpaid_total || s.postpaid_total_amount),
      }));
      const tPostNet   = filteredSalesData.reduce((a, s) => a + Number(s.postpaid_net   || s.postpaid_net_amount   || 0), 0);
      const tPostTotal = filteredSalesData.reduce((a, s) => a + Number(s.postpaid_total || s.postpaid_total_amount || 0), 0);
      data.push({ Outlet: "Total", "Postpaid Net": formatAmount(tPostNet), "Postpaid Total": formatAmount(tPostTotal) });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "Sales_Report.xlsx");
  };

  return (
    <div className="om-summary-container">

      {/* ── Page Header ── */}
      <div className="om-summary-page-header">
        <div className="om-summary-icon-badge">📊</div>
        <div>
          <h2 className="om-summary-title">Sales Summary</h2>
          <p className="om-summary-subtitle">Track revenue across all outlets</p>
        </div>
      </div>

      {/* ── Controls Card ── */}
      <div className="om-summary-controls-card">
        <div className="om-summary-controls-left">

          {/* Company dropdown */}
          <select
            className="om-summary-select"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">🏪 All Stalls</option>
            {companies.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Date filter */}
          <DateRangeFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />

          {/* Export */}
          <button className="om-summary-export" onClick={exportExcel}>
            📥 Export Excel
          </button>
        </div>

        {/* Submit */}
        <button className="om-summary-btn" onClick={fetchData}>
          <span className="om-summary-btn-icon">🔍</span>
          Generate Report
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="om-summary-loader-wrap">
          <div className="om-summary-loader" />
          <span className="om-summary-loader-text">Fetching sales data…</span>
        </div>
      ) : (
        <>
          {salesData.length > 0 && (
            <StatsStrip data={salesData} mode={mode} />
          )}
          <SalesTable data={salesData} type={mode} />
        </>
      )}

    </div>
  );
}