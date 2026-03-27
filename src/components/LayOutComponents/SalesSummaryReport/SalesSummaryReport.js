import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./SalesSummaryReport.css";
import { useAuth } from "../../AuthContex/AdminContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

const SalesSummaryReport = () => {

  const { adminId } = useAuth();

  const [stalls, setStalls] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [sortOrder, setSortOrder] = useState("ASC");
  const [dateFilter, setDateFilter] = useState("TODAY");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingStalls, setLoadingStalls] = useState(false);

  /* ---------------- DATE HELPERS ---------------- */

  const formatDate = useCallback((date) => {
    return date.toISOString().split("T")[0];
  }, []);

  const getToday = useCallback(() => {
    const today = new Date();
    return [formatDate(today), formatDate(today)];
  }, [formatDate]);

  const getThisWeek = useCallback(() => {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const start = new Date(today.setDate(first));
    const end = new Date();
    return [formatDate(start), formatDate(end)];
  }, [formatDate]);

  const getThisMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();
    return [formatDate(start), formatDate(end)];
  }, [formatDate]);

  /* ---------------- ROUND OFF ---------------- */

  const roundOff = (value) => {
    const integer = Math.floor(value);
    const decimal = value - integer;
    return decimal < 0.5 ? integer : integer + 1;
  };

  /* ---------------- FETCH COMPANIES ---------------- */

  useEffect(() => {

    fetch(`${API_BASE}/company-domains/`)
      .then(res => res.json())
      .then(data => setCompanies(data || []))
      .catch(err => console.error(err));

  }, []);

  /* ---------------- FETCH STALLS ---------------- */

  const fetchStalls = useCallback(async () => {

    try {

      if (!adminId) return;

      setLoadingStalls(true);

      const res = await fetch(`${API_BASE}/stalls/admin/${adminId}`);
      const data = await res.json();

      if (!Array.isArray(data)) return;

      setStalls(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStalls(false);
    }

  }, [adminId]);

  /* ---------------- FETCH SALES ---------------- */

  const fetchSalesSummary = useCallback(async (start, end) => {

    try {

      setLoadingSales(true);

      /* COMPANY SALES SUMMARY */

      if (selectedCompany) {

        const url = `${API_BASE}/company-sales-summary/?company=${selectedCompany}&start_date=${start}&end_date=${end}`;

        const res = await fetch(url);
        const data = await res.json();

        setSalesData(data || []);
        setFilteredData(data || []);

      }

      /* ALL STALL SALES SUMMARY */

      else {

        if (!stalls.length) return;

        const stallIds = stalls.map((s) => s.id).join(",");

        const url = `${API_BASE}/orders/sales-summary/updated?stall_ids=${stallIds}&start_date=${start}T00:00:00&end_date=${end}T23:59:59`;

        const res = await fetch(url);
        const data = await res.json();

        const stallsData = data?.stalls || [];

        setSalesData(stallsData);
        setFilteredData(stallsData);

      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }

  }, [stalls, selectedCompany]);

  /* ---------------- DATE FILTER ---------------- */

  useEffect(() => {

    let start;
    let end;

    if (dateFilter === "TODAY") [start, end] = getToday();
    if (dateFilter === "WEEK") [start, end] = getThisWeek();
    if (dateFilter === "MONTH") [start, end] = getThisMonth();

    if (dateFilter !== "CUSTOM") {

      setStartDate(start);
      setEndDate(end);

      fetchSalesSummary(start, end);

    }

  }, [dateFilter, stalls, selectedCompany, fetchSalesSummary, getToday, getThisWeek, getThisMonth]);

  /* ---------------- SORT ---------------- */

  useEffect(() => {

    let data = [...salesData];

    data.sort((a, b) =>
      sortOrder === "ASC"
        ? (a.stall_name || a.outlet).localeCompare(b.stall_name || b.outlet)
        : (b.stall_name || b.outlet).localeCompare(a.stall_name || a.outlet)
    );

    setFilteredData(data);

  }, [sortOrder, salesData]);

  /* ---------------- TOTAL CALCULATION ---------------- */

  const totals = useMemo(() => {

    return filteredData.reduce(
      (acc, item) => {

        acc.prepaid_after += item.prepaid_net_after_deduction || 0;
        acc.prepaid_gross += item.prepaid_gross_amount || 0;
        acc.postpaid_net += item.postpaid_net_amount || item.postpaid_net || 0;
        acc.postpaid_gross += item.postpaid_gross_amount || item.postpaid_total || 0;

        return acc;

      },
      {
        prepaid_after: 0,
        prepaid_gross: 0,
        postpaid_net: 0,
        postpaid_gross: 0,
      }
    );

  }, [filteredData]);

  const roundedPrepaidAfter = roundOff(totals.prepaid_after);

  /* ---------------- EXPORT EXCEL ---------------- */

  const exportToExcel = () => {

    const exportData = filteredData.map((stall) => ({

      Outlet: stall.stall_name || stall.outlet,
      "Prepaid Net": stall.prepaid_net_after_deduction,
      "Prepaid Gross": stall.prepaid_gross_amount,
      "Postpaid Net": stall.postpaid_net_amount || stall.postpaid_net,
      "Postpaid Gross": stall.postpaid_gross_amount || stall.postpaid_total,

    }));

    exportData.push({
      Outlet: "TOTAL",
      "Prepaid Net": roundedPrepaidAfter,
      "Prepaid Gross": totals.prepaid_gross,
      "Postpaid Net": totals.postpaid_net,
      "Postpaid Gross": totals.postpaid_gross,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `sales_report_${startDate}_to_${endDate}.xlsx`);

  };

  /* ---------------- LOAD STALLS ---------------- */

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  /* ---------------- CUSTOM REPORT ---------------- */

  const generateCustomReport = () => {

    if (!startDate || !endDate) {
      alert("Please select start and end date");
      return;
    }

    fetchSalesSummary(startDate, endDate);

  };

  /* ---------------- UI ---------------- */

  return (
    <div className="sales-container">

      <h2>Sales Summary Report</h2>

      {loadingStalls && <p>Loading stalls...</p>}

      <div className="filters">

        {/* COMPANY DROPDOWN */}

        <div>
          <label>Company</label>

          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >

            <option value="">All Stalls</option>

            {companies.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}

          </select>

        </div>

        {/* DATE RANGE */}

        <div>

          <label>Date Range</label>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >

            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="CUSTOM">Custom</option>

          </select>

        </div>

        {dateFilter === "CUSTOM" && (
          <>
            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button onClick={generateCustomReport}>Generate</button>
          </>
        )}

        {/* SORT */}

        <div>

          <label>Sort</label>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >

            <option value="ASC">Outlet A → Z</option>
            <option value="DESC">Outlet Z → A</option>

          </select>

        </div>

        <button className="export-btn" onClick={exportToExcel}>
          Export Excel
        </button>

      </div>

      {loadingSales ? (
        <p>Generating report...</p>
      ) : (

        <table className="sales-table">

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

            {filteredData.map((stall, index) => (

              <tr key={index}>

                <td>{stall.stall_name || stall.outlet}</td>
                <td>₹{stall.prepaid_net_after_deduction ?? 0}</td>
                <td>₹{stall.prepaid_gross_amount ?? 0}</td>
                <td>₹{stall.postpaid_net_amount ?? stall.postpaid_net ?? 0}</td>
                <td>₹{stall.postpaid_gross_amount ?? stall.postpaid_total ?? 0}</td>

              </tr>

            ))}

            <tr className="total-row">

              <td><b>Total</b></td>
              <td><b>₹{roundedPrepaidAfter}</b></td>
              <td><b>₹{totals.prepaid_gross.toFixed(2)}</b></td>
              <td><b>₹{totals.postpaid_net.toFixed(2)}</b></td>
              <td><b>₹{totals.postpaid_gross.toFixed(2)}</b></td>

            </tr>

          </tbody>

        </table>

      )}

    </div>
  );

};

export default SalesSummaryReport;