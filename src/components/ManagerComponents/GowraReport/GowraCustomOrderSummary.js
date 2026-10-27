import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { exportSheetToPdf } from "../../../utils/exportSheetToPdf";
import "./GowraCustomOrderSummary.css";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://admin-aged-field-2794.fly.dev");

const PAYMENT_TYPE = "prepaid"; // fixed background default matching OM dashboard
const APPLY_FEE = true; // fixed background default (net 97%)

export default function GowraCustomOrderSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Outlets list from building
  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState("all");

  // Query Parameters
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("day"); // 'day' or 'stall'

  // Fully Editable Metadata fields
  const [reportTitle, setReportTitle] = useState("Order Summary");
  const [businessName, setBusinessName] = useState("Gowra (Parent)");
  const [summaryByLabel, setSummaryByLabel] = useState("DAY");
  const [periodLabel, setPeriodLabel] = useState("6 Months");
  const [generatedOn, setGeneratedOn] = useState("");
  const [generatedBy, setGeneratedBy] = useState("Sai Ram");

  // Column Headers Customization
  const [colHeaders, setColHeaders] = useState({
    date: "Date",
    orders: "No. of Orders",
    net_amount: "Net Amount",
    discount: "Discount",
    charges: "Charges",
    tax: "Tax",
    round_off: "Round Off",
    total_amount: "Total Amount",
  });

  // Column Visibility Customization
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    orders: true,
    net_amount: true,
    discount: true,
    charges: true,
    tax: true,
    round_off: true,
    total_amount: true,
  });

  // Editable Table Rows state
  const [editableRows, setEditableRows] = useState([]);
  const [rawApiRows, setRawApiRows] = useState([]);

  // Total Row Customization
  const [showTotalRow, setShowTotalRow] = useState(false);
  const [customTotalRow, setCustomTotalRow] = useState(null);

  // UI state
  const [showCustomizer, setShowCustomizer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasCustomEdits, setHasCustomEdits] = useState(false);

  // ── Saved Reports State ──
  const [savedReports, setSavedReports] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveReportName, setSaveReportName] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [showSavedListModal, setShowSavedListModal] = useState(false);
  const [activeSavedReport, setActiveSavedReport] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const reportRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  /* ── 1. Fetch Outlets for this Building ── */
  useEffect(() => {
    if (!user?.building_id) return;
    axios
      .get(`${API_BASE}/stalls/building/${user.building_id}`)
      .then((res) => setStalls(res.data || []))
      .catch((err) => console.error("Error fetching stalls:", err));
  }, [user]);

  /* ── 2. Sync Summary By Label when Group By changes ── */
  useEffect(() => {
    if (!activeSavedReport) {
      const defaultLabel = groupBy === "stall" ? "OUTLET" : "DAY";
      setSummaryByLabel(defaultLabel);
      setColHeaders((prev) => ({
        ...prev,
        date: groupBy === "stall" ? "Outlet Name" : "Date",
      }));
    }
  }, [groupBy, activeSavedReport]);

  /* ── Helper: Format Numbers ── */
  const formatNumber = (val) => {
    if (val === null || val === undefined || val === "") return "0.0";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num % 1 === 0 ? `${num}.0` : num.toFixed(2);
  };

  /* ── 3. Fetch Saved Reports List ── */
  const fetchSavedReports = useCallback(async () => {
    try {
      const bId = user?.building_id || "";
      const url = bId ? `${API_BASE}/orders/saved-reports?building_id=${bId}` : `${API_BASE}/orders/saved-reports`;
      const res = await axios.get(url);
      if (Array.isArray(res.data)) {
        setSavedReports(res.data);
      }
    } catch (err) {
      console.error("Error fetching saved reports:", err);
      // Fallback to localStorage
      try {
        const local = localStorage.getItem(`gowra_saved_reports_${user?.building_id || "default"}`);
        if (local) setSavedReports(JSON.parse(local));
      } catch (e) {
        console.error("Local storage read error:", e);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchSavedReports();
  }, [fetchSavedReports]);

  /* ── 4. Fetch Live Report Data from API ── */
  const fetchReport = useCallback(async () => {
    setActiveSavedReport(null);
    setLoading(true);
    setErrorMsg("");

    try {
      const params = new URLSearchParams();
      if (user?.building_id) params.append("building_id", user.building_id);
      if (selectedStall && selectedStall !== "all") params.append("stall_id", selectedStall);
      params.append("period", period);
      params.append("payment_type", PAYMENT_TYPE);
      params.append("apply_fee", APPLY_FEE ? "true" : "false");
      params.append("group_by", groupBy);

      if (period === "custom") {
        if (!startDate || !endDate) {
          setErrorMsg("Please select both start and end dates.");
          setLoading(false);
          return;
        }
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      }

      params.append("generated_by", generatedBy || "Sai Ram");

      const res = await axios.get(`${API_BASE}/orders/daily-summary?${params.toString()}`);
      const data = res.data;

      // Populate metadata
      setBusinessName(data.business_name || "Gowra (Parent)");
      setSummaryByLabel(data.summary_by || (groupBy === "stall" ? "OUTLET" : "DAY"));
      setPeriodLabel(data.period || "6 Months");
      setGeneratedOn(data.report_generated_on || new Date().toLocaleString());
      setGeneratedBy(data.report_generated_by || "Sai Ram");

      // Format rows for editing
      const formatted = (data.rows || []).map((r, i) => ({
        id: `row-${i}-${Date.now()}`,
        date: r.date || r.stall_name || "",
        orders: r.no_of_orders ?? 0,
        net_amount: formatNumber(r.net_amount),
        discount: formatNumber(r.discount),
        charges: formatNumber(r.charges),
        tax: formatNumber(r.tax),
        round_off: formatNumber(r.round_off),
        total_amount: formatNumber(r.total_amount),
      }));

      setRawApiRows(JSON.parse(JSON.stringify(formatted)));
      setEditableRows(formatted);
      setHasCustomEdits(false);
    } catch (err) {
      console.error("Error loading Gowra order summary:", err);
      setErrorMsg("Failed to load customized order summary report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedStall, period, startDate, endDate, groupBy, generatedBy]);

  // Initial load
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ── 5. Cell Editing Handler ── */
  const handleCellChange = (rowIndex, field, newValue) => {
    setEditableRows((prev) => {
      const copy = [...prev];
      copy[rowIndex] = {
        ...copy[rowIndex],
        [field]: newValue,
      };
      return copy;
    });
    setHasCustomEdits(true);
  };

  /* ── 6. Add New Editable Row ── */
  const handleAddRow = () => {
    const newRow = {
      id: `custom-row-${Date.now()}`,
      date: groupBy === "stall" ? "New Outlet" : "Custom Date",
      orders: 0,
      net_amount: "0.0",
      discount: "0.0",
      charges: "0.0",
      tax: "0.0",
      round_off: "0.0",
      total_amount: "0.0",
    };
    setEditableRows((prev) => [...prev, newRow]);
    setHasCustomEdits(true);
  };

  /* ── 7. Delete Row ── */
  const handleDeleteRow = (rowIndex) => {
    setEditableRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setHasCustomEdits(true);
  };

  /* ── 8. Reset to Original API Data ── */
  const handleResetToApiData = () => {
    setEditableRows(JSON.parse(JSON.stringify(rawApiRows)));
    setHasCustomEdits(false);
  };

  /* ── 9. Calculate Automatic Totals ── */
  const calculateTotals = () => {
    if (!editableRows || editableRows.length === 0) return {};
    const totals = {
      orders: 0,
      net_amount: 0,
      discount: 0,
      charges: 0,
      tax: 0,
      round_off: 0,
      total_amount: 0,
    };
    editableRows.forEach((r) => {
      totals.orders += Number(r.orders || 0);
      totals.net_amount += Number(r.net_amount || 0);
      totals.discount += Number(r.discount || 0);
      totals.charges += Number(r.charges || 0);
      totals.tax += Number(r.tax || 0);
      totals.round_off += Number(r.round_off || 0);
      totals.total_amount += Number(r.total_amount || 0);
    });
    return totals;
  };

  const autoTotals = calculateTotals();

  /* ── 10. Column Definitions ── */
  const columnsList = [
    { key: "date", label: colHeaders.date },
    { key: "orders", label: colHeaders.orders },
    { key: "net_amount", label: colHeaders.net_amount },
    { key: "discount", label: colHeaders.discount },
    { key: "charges", label: colHeaders.charges },
    { key: "tax", label: colHeaders.tax },
    { key: "round_off", label: colHeaders.round_off },
    { key: "total_amount", label: colHeaders.total_amount },
  ];

  const activeCols = columnsList.filter((col) => visibleColumns[col.key]);

  /* ── 11. Toggle Column Visibility ── */
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /* ── 12. Save Report Functionality ── */
  const openSaveModal = () => {
    const defaultName = `${businessName || "Gowra"} - ${reportTitle || "Order Summary"} (${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })})`;
    setSaveReportName(defaultName);
    setShowSaveModal(true);
  };

  const handleSaveReportConfirm = async () => {
    if (!saveReportName.trim()) {
      alert("Please enter a name for this report.");
      return;
    }

    setSavingReport(true);
    const payload = {
      building_id: user?.building_id || null,
      report_name: saveReportName.trim(),
      report_title: reportTitle,
      business_name: businessName,
      summary_by: summaryByLabel,
      period: periodLabel,
      generated_on: generatedOn || new Date().toLocaleString(),
      generated_by: generatedBy,
      col_headers: colHeaders,
      visible_columns: visibleColumns,
      show_total_row: showTotalRow,
      rows: editableRows,
      totals: autoTotals,
    };

    try {
      const res = await axios.post(`${API_BASE}/orders/saved-reports`, payload);
      const savedItem = res.data?.report || { ...payload, id: `local-${Date.now()}` };

      // Update local storage backup
      try {
        const storageKey = `gowra_saved_reports_${user?.building_id || "default"}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = [payload, ...existing.filter((x) => x.id !== savedItem.id)];
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      setShowSaveModal(false);
      showToast(`✅ Report "${saveReportName}" saved successfully!`);
      fetchSavedReports();
    } catch (err) {
      console.error("Error saving report to API, saving to localStorage:", err);
      // Fallback to local storage if API fails
      try {
        const storageKey = `gowra_saved_reports_${user?.building_id || "default"}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const localItem = { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
        localStorage.setItem(storageKey, JSON.stringify([localItem, ...existing]));
        setSavedReports((prev) => [localItem, ...prev]);
        setShowSaveModal(false);
        showToast(`✅ Report "${saveReportName}" saved locally!`);
      } catch (e) {
        alert("Failed to save report. Please try again.");
      }
    } finally {
      setSavingReport(false);
    }
  };

  /* ── 13. Load a Saved Report onto Document Sheet ── */
  const handleLoadSavedReport = (report) => {
    setActiveSavedReport(report);
    setReportTitle(report.report_title || "Order Summary");
    setBusinessName(report.business_name || "Gowra (Parent)");
    setSummaryByLabel(report.summary_by || "DAY");
    setPeriodLabel(report.period || "6 Months");
    setGeneratedOn(report.generated_on || "");
    setGeneratedBy(report.generated_by || "Sai Ram");

    if (report.col_headers) setColHeaders(report.col_headers);
    if (report.visible_columns) setVisibleColumns(report.visible_columns);
    setShowTotalRow(Boolean(report.show_total_row));

    const formattedRows = (report.rows || []).map((r, i) => ({
      id: r.id || `saved-row-${i}`,
      date: r.date || "",
      orders: r.orders ?? 0,
      net_amount: formatNumber(r.net_amount),
      discount: formatNumber(r.discount),
      charges: formatNumber(r.charges),
      tax: formatNumber(r.tax),
      round_off: formatNumber(r.round_off),
      total_amount: formatNumber(r.total_amount),
    }));

    setEditableRows(formattedRows);
    setRawApiRows(JSON.parse(JSON.stringify(formattedRows)));
    setHasCustomEdits(false);
    setShowSavedListModal(false);
    showToast(`📂 Loaded report: "${report.report_name}"`);
  };

  /* ── 14. Delete Saved Report ── */
  const handleDeleteSavedReport = async (reportId, reportName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete saved report "${reportName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/orders/saved-reports/${reportId}`);
    } catch (err) {
      console.warn("API delete failed, removing from local storage:", err);
    }

    // Also remove from local storage and state
    try {
      const storageKey = `gowra_saved_reports_${user?.building_id || "default"}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const filtered = existing.filter((r) => r.id !== reportId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }

    setSavedReports((prev) => prev.filter((r) => r.id !== reportId));
    if (activeSavedReport?.id === reportId) {
      setActiveSavedReport(null);
    }
    showToast(`🗑️ Deleted report "${reportName}"`);
  };

  /* ── 15. Export Excel with Exact Current / Saved Data ── */
  const handleExportExcel = () => {
    if (!editableRows || editableRows.length === 0) {
      alert("No report data available to export.");
      return;
    }

    const wsData = [
      [reportTitle || "Order Summary"],
      [],
      ["Business Name:", businessName || "Gowra (Parent)"],
      ["Summary By:", summaryByLabel || (groupBy === "stall" ? "OUTLET" : "DAY")],
      ["Period:", periodLabel || "6 Months"],
      ["Report Generated On:", generatedOn],
      ["Report Generated By:", generatedBy || "Sai Ram"],
      [],
      activeCols.map((c) => colHeaders[c.key]),
    ];

    editableRows.forEach((row) => {
      const rowItem = activeCols.map((col) => {
        if (col.key === "date") return row.date;
        if (col.key === "orders") return Number(row.orders || 0);
        return Number(row[col.key] || 0);
      });
      wsData.push(rowItem);
    });

    if (showTotalRow) {
      const totalRowItem = activeCols.map((col) => {
        if (col.key === "date") return "Total";
        if (col.key === "orders") return customTotalRow?.orders ?? autoTotals.orders;
        const val = customTotalRow?.[col.key] ?? autoTotals[col.key];
        return Number(val || 0);
      });
      wsData.push(totalRowItem);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = activeCols.map(() => ({ wch: 16 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gowra Summary");

    const safeName = (businessName || "Gowra_Order_Summary").replace(/[^a-zA-Z0-9_-]/g, "_");
    XLSX.writeFile(wb, `${safeName}_Custom_Report.xlsx`);
  };

  /* ── 16. High-Res PDF Download ── */
  const handleDownloadPDF = async () => {
    if (!reportRef.current || !editableRows) {
      alert("No report data available to export.");
      return;
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    setExportingPdf(true);
    try {
      // Let the blur above commit any in-progress cell edit before the sheet is copied
      await new Promise((resolve) => setTimeout(resolve, 50));
      const safeName = (businessName || "Gowra_Order_Summary").replace(/[^a-zA-Z0-9_-]/g, "_");
      await exportSheetToPdf(reportRef.current, `${safeName}_Custom_Order_Summary.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="gowra-report-page-container">
      {/* ── Toast Notification ── */}
      {toastMsg && <div className="gowra-toast-notification">{toastMsg}</div>}

      {/* ── Top Main Action Bar ── */}
      <div className="gowra-report-top-bar no-print">
        <div className="gowra-report-top-left">
          <button
            className="gowra-report-back-btn"
            onClick={() => navigate("/manager-stalls")}
            title="Back to Outlets Dashboard"
          >
            ← Back
          </button>
          <div className="gowra-report-header-title">
            <span className="gowra-badge">OM</span>
            <h2>Gowra Order Summary</h2>
          </div>
        </div>

        <div className="gowra-report-top-right">
          {/* 💾 Save Report Button */}
          <button
            className="gowra-btn-save-main"
            onClick={openSaveModal}
            title="Save this customized report snapshot for future access"
          >
            💾 Save Report
          </button>

          {/* 📂 Saved Reports List Button */}
          <button
            className="gowra-btn-saved-list"
            onClick={() => setShowSavedListModal(true)}
            title="View all saved reports"
          >
            📂 Saved Reports ({savedReports.length})
          </button>

          <button
            className={`gowra-btn-toggle-customizer ${showCustomizer ? "active" : ""}`}
            onClick={() => setShowCustomizer(!showCustomizer)}
          >
            ⚙️ {showCustomizer ? "Hide Controls" : "Show Controls"}
          </button>
          <button
            className="gowra-btn-secondary"
            onClick={handleExportExcel}
            title="Download formatted Excel sheet"
          >
            📥 Export Excel
          </button>
          <button
            className="gowra-btn-print"
            onClick={handleDownloadPDF}
            disabled={exportingPdf}
            title="Download direct high-res PDF"
          >
            {exportingPdf ? "⏳ Generating PDF…" : "📄 Save as PDF"}
          </button>
        </div>
      </div>

      {/* ── Active Saved Report Banner (If viewing a saved snapshot) ── */}
      {activeSavedReport && (
        <div className="gowra-active-saved-banner no-print">
          <div className="gowra-active-saved-info">
            <span className="gowra-active-icon">📂</span>
            <div>
              <strong>Viewing Saved Report:</strong> {activeSavedReport.report_name}
              <span className="gowra-active-meta">
                (Saved on: {activeSavedReport.created_at ? new Date(activeSavedReport.created_at).toLocaleString() : "Recently"})
              </span>
            </div>
          </div>
          <button className="gowra-btn-back-live" onClick={fetchReport}>
            🔄 Return to Live Data
          </button>
        </div>
      )}

      {/* ── Interactive OM Customization Controls Studio ── */}
      {showCustomizer && (
        <div className="gowra-customizer-card no-print">
          <div className="gowra-customizer-section-title">
            <span>⚙️ Query Filters & Options</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {hasCustomEdits && (
                <span className="gowra-edited-notice">
                  ✏️ You have manual edits in the report
                </span>
              )}
              <button className="gowra-btn-reset-link" onClick={fetchReport}>
                Reset to Live API
              </button>
            </div>
          </div>

          {/* Section 1: Data Filters & Grouping (Payment Mode & 3% Fee hidden as requested) */}
          <div className="gowra-filter-row">
            <div className="gowra-field-group">
              <label>Group / Summary By:</label>
              <select
                className="gowra-select"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="day">📅 By Day (Daily Summary)</option>
                <option value="stall">🏪 By Outlet (Outlet Summary)</option>
              </select>
            </div>

            <div className="gowra-field-group">
              <label>Period Preset:</label>
              <select
                className="gowra-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="this_month">This Month (Default)</option>
                <option value="6_months">6 Months</option>
                <option value="last_month">Last Month</option>
                <option value="this_week">This Week</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {period === "custom" && (
              <>
                <div className="gowra-field-group">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    className="gowra-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="gowra-field-group">
                  <label>End Date:</label>
                  <input
                    type="date"
                    className="gowra-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="gowra-field-group">
              <label>Outlets / Stalls:</label>
              <select
                className="gowra-select"
                value={selectedStall}
                onChange={(e) => setSelectedStall(e.target.value)}
              >
                <option value="all">🏢 All Outlets (Parent)</option>
                {stalls.map((s) => (
                  <option key={s.id || s.stall_id} value={s.id || s.stall_id}>
                    🏪 {s.name || s.stall_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="gowra-field-group gowra-align-bottom">
              <button
                className="gowra-btn-apply-filters"
                onClick={fetchReport}
                disabled={loading}
              >
                {loading ? "Loading…" : "🔄 Fetch Data"}
              </button>
            </div>
          </div>

          <div className="gowra-customizer-divider" />

          {/* Section 2: Header Metadata Customization */}
          <div className="gowra-metadata-edit-grid">
            <div className="gowra-field-group">
              <label>Document Title:</label>
              <input
                type="text"
                className="gowra-input"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Order Summary"
              />
            </div>
            <div className="gowra-field-group">
              <label>Business Name:</label>
              <input
                type="text"
                className="gowra-input"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Gowra (Parent)"
              />
            </div>
            <div className="gowra-field-group">
              <label>Summary By Label:</label>
              <input
                type="text"
                className="gowra-input"
                value={summaryByLabel}
                onChange={(e) => setSummaryByLabel(e.target.value)}
                placeholder="DAY or OUTLET"
              />
            </div>
            <div className="gowra-field-group">
              <label>Period Label:</label>
              <input
                type="text"
                className="gowra-input"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="6 Months"
              />
            </div>
            <div className="gowra-field-group">
              <label>Report Generated By:</label>
              <input
                type="text"
                className="gowra-input"
                value={generatedBy}
                onChange={(e) => setGeneratedBy(e.target.value)}
                placeholder="Sai Ram"
              />
            </div>
            <div className="gowra-field-group gowra-toggle-wrapper">
              <label className="gowra-checkbox-label">
                <input
                  type="checkbox"
                  checked={showTotalRow}
                  onChange={(e) => setShowTotalRow(e.target.checked)}
                />
                <span>Show Total Row at Bottom</span>
              </label>
            </div>
          </div>

          <div className="gowra-customizer-divider" />

          {/* Section 3: Column Visibility Customizer */}
          <div className="gowra-columns-customizer">
            <span className="gowra-columns-label">Visible Columns:</span>
            <div className="gowra-checkbox-pill-group">
              {columnsList.map((col) => (
                <label key={col.key} className={`gowra-col-pill ${visibleColumns[col.key] ? "checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.key]}
                    onChange={() => toggleColumn(col.key)}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Table Action Strip (Add Row, Reset, Live Editing Notice) ── */}
      <div className="gowra-editing-toolbar no-print">
        <div className="gowra-editing-tip">
          <span className="gowra-tip-icon">💡</span>
          <span>
            <strong>Interactive Edit Mode:</strong> Click directly on any cell, header, or text on the document sheet to edit!
          </span>
        </div>
        <div className="gowra-editing-actions">
          <button className="gowra-btn-add-row" onClick={handleAddRow}>
            ➕ Add Row
          </button>
          {hasCustomEdits && (
            <button className="gowra-btn-reset-edits" onClick={handleResetToApiData}>
              🔄 Reset Table Edits
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="gowra-error-banner no-print">
          {errorMsg}
        </div>
      )}

      {/* ── Printable / Preview Document Sheet (100% Matching Reference Image) ── */}
      <div className="gowra-document-sheet" ref={reportRef}>
        {loading ? (
          <div className="gowra-loader-wrapper">
            <div className="gowra-spinner" />
            <span>Loading report data…</span>
          </div>
        ) : (
          <>
            {/* Centered Document Title (Directly Editable) */}
            <h1
              className="gowra-doc-title gowra-inline-editable"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => setReportTitle(e.currentTarget.innerText.trim())}
              title="Click to edit document title"
            >
              {reportTitle || "Order Summary"}
            </h1>

            {/* Metadata Info Block (All Directly Editable) */}
            <div className="gowra-meta-block">
              <div className="gowra-meta-row">
                <span className="gowra-meta-label">Business Name:</span>
                <span
                  className="gowra-meta-value gowra-inline-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setBusinessName(e.currentTarget.innerText.trim())}
                  title="Click to edit business name"
                >
                  {businessName || "Gowra (Parent)"}
                </span>
              </div>
              <div className="gowra-meta-row">
                <span className="gowra-meta-label">Summary By:</span>
                <span
                  className="gowra-meta-value gowra-inline-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setSummaryByLabel(e.currentTarget.innerText.trim())}
                  title="Click to edit summary by"
                >
                  {summaryByLabel || (groupBy === "stall" ? "OUTLET" : "DAY")}
                </span>
              </div>
              <div className="gowra-meta-row">
                <span className="gowra-meta-label">Period:</span>
                <span
                  className="gowra-meta-value gowra-inline-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setPeriodLabel(e.currentTarget.innerText.trim())}
                  title="Click to edit period label"
                >
                  {periodLabel || "6 Months"}
                </span>
              </div>
              <div className="gowra-meta-row">
                <span className="gowra-meta-label">Report Generated On:</span>
                <span
                  className="gowra-meta-value gowra-inline-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setGeneratedOn(e.currentTarget.innerText.trim())}
                  title="Click to edit timestamp"
                >
                  {generatedOn}
                </span>
              </div>
              <div className="gowra-meta-row">
                <span className="gowra-meta-label">Report Generated By:</span>
                <span
                  className="gowra-meta-value gowra-inline-editable"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setGeneratedBy(e.currentTarget.innerText.trim())}
                  title="Click to edit generated by"
                >
                  {generatedBy || "Sai Ram"}
                </span>
              </div>
            </div>

            {/* Table with 100% Fully Editable Cells */}
            <div className="gowra-table-wrapper">
              <table className="gowra-report-table">
                <thead>
                  <tr>
                    {activeCols.map((col) => (
                      <th
                        key={col.key}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                          const val = e.currentTarget.innerText.trim();
                          setColHeaders((prev) => ({ ...prev, [col.key]: val }));
                        }}
                        className="gowra-inline-editable-th"
                        title="Click to edit column header"
                      >
                        {colHeaders[col.key]}
                      </th>
                    ))}
                    <th className="no-print gowra-action-th" style={{ width: "40px", textAlign: "center" }}>
                      ✕
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editableRows && editableRows.length > 0 ? (
                    editableRows.map((row, idx) => (
                      <tr key={row.id || idx}>
                        {activeCols.map((col) => (
                          <td
                            key={col.key}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const rawVal = e.currentTarget.innerText.trim();
                              handleCellChange(idx, col.key, rawVal);
                            }}
                            className="gowra-editable-cell"
                            title={`Click to edit ${colHeaders[col.key]}`}
                          >
                            {row[col.key]}
                          </td>
                        ))}
                        <td className="no-print gowra-delete-row-td">
                          <button
                            className="gowra-btn-delete-row"
                            onClick={() => handleDeleteRow(idx)}
                            title="Delete this row"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeCols.length + 1} className="gowra-empty-msg">
                        No orders recorded. Click <strong>"➕ Add Row"</strong> above to add custom records.
                      </td>
                    </tr>
                  )}

                  {/* Optional Customizable Total Row */}
                  {showTotalRow && (
                    <tr className="gowra-total-row">
                      {activeCols.map((col) => {
                        if (col.key === "date") {
                          return (
                            <td
                              key={col.key}
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="gowra-editable-cell"
                            >
                              Total
                            </td>
                          );
                        }
                        if (col.key === "orders") {
                          const ordersVal = customTotalRow?.orders ?? autoTotals.orders;
                          return (
                            <td
                              key={col.key}
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => {
                                setCustomTotalRow((prev) => ({
                                  ...prev,
                                  orders: Number(e.currentTarget.innerText.trim()) || 0,
                                }));
                              }}
                              className="gowra-editable-cell"
                              title="Click to edit total orders"
                            >
                              {ordersVal}
                            </td>
                          );
                        }
                        const curVal = customTotalRow?.[col.key] ?? formatNumber(autoTotals[col.key]);
                        return (
                          <td
                            key={col.key}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              setCustomTotalRow((prev) => ({
                                ...prev,
                                [col.key]: e.currentTarget.innerText.trim(),
                              }));
                            }}
                            className="gowra-editable-cell"
                            title={`Click to edit total ${colHeaders[col.key]}`}
                          >
                            {curVal}
                          </td>
                        );
                      })}
                      <td className="no-print" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── 💾 SAVE REPORT MODAL ── */}
      {showSaveModal && (
        <div className="gowra-modal-overlay no-print" onClick={() => setShowSaveModal(false)}>
          <div className="gowra-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gowra-modal-header">
              <h3>💾 Save Report Snapshot</h3>
              <button className="gowra-modal-close-btn" onClick={() => setShowSaveModal(false)}>
                ×
              </button>
            </div>
            <div className="gowra-modal-body">
              <p className="gowra-modal-desc">
                Save this customized report snapshot so you or any manager can view, edit, or download it in the future.
              </p>

              <div className="gowra-modal-field">
                <label>Report Name:</label>
                <input
                  type="text"
                  className="gowra-modal-input"
                  value={saveReportName}
                  onChange={(e) => setSaveReportName(e.target.value)}
                  placeholder="e.g. Gowra Summary - 14 Oct 2026"
                  autoFocus
                />
              </div>

              <div className="gowra-modal-summary-box">
                <div className="gowra-summary-chip">
                  <span>🏢 Business:</span> <strong>{businessName}</strong>
                </div>
                <div className="gowra-summary-chip">
                  <span>📅 Period:</span> <strong>{periodLabel}</strong>
                </div>
                <div className="gowra-summary-chip">
                  <span>📊 Total Rows:</span> <strong>{editableRows.length}</strong>
                </div>
                <div className="gowra-summary-chip">
                  <span>👤 Generated By:</span> <strong>{generatedBy}</strong>
                </div>
              </div>
            </div>
            <div className="gowra-modal-footer">
              <button
                className="gowra-btn-secondary"
                onClick={() => setShowSaveModal(false)}
                disabled={savingReport}
              >
                Cancel
              </button>
              <button
                className="gowra-btn-primary"
                onClick={handleSaveReportConfirm}
                disabled={savingReport}
              >
                {savingReport ? "Saving…" : "💾 Save Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 📂 SAVED REPORTS LIST DRAWER / MODAL ── */}
      {showSavedListModal && (
        <div className="gowra-modal-overlay no-print" onClick={() => setShowSavedListModal(false)}>
          <div className="gowra-modal-card gowra-saved-list-card" onClick={(e) => e.stopPropagation()}>
            <div className="gowra-modal-header">
              <h3>📂 Saved Custom Reports ({savedReports.length})</h3>
              <button className="gowra-modal-close-btn" onClick={() => setShowSavedListModal(false)}>
                ×
              </button>
            </div>
            <div className="gowra-modal-body gowra-saved-list-body">
              {savedReports && savedReports.length > 0 ? (
                <div className="gowra-saved-cards-container">
                  {savedReports.map((r) => (
                    <div
                      key={r.id}
                      className={`gowra-saved-report-card ${activeSavedReport?.id === r.id ? "active-loaded" : ""}`}
                    >
                      <div className="gowra-saved-card-left">
                        <div className="gowra-saved-card-title-row">
                          <h4 className="gowra-saved-title">{r.report_name}</h4>
                          {activeSavedReport?.id === r.id && (
                            <span className="gowra-loaded-badge">Currently Loaded</span>
                          )}
                        </div>
                        <div className="gowra-saved-meta-row">
                          <span>🏢 {r.business_name || "Gowra"}</span>
                          <span>•</span>
                          <span>📅 {r.period || "Period"}</span>
                          <span>•</span>
                          <span>📊 {r.rows?.length || 0} rows</span>
                          <span>•</span>
                          <span>
                            🕒 Saved on:{" "}
                            {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "Recently"}
                          </span>
                        </div>
                      </div>
                      <div className="gowra-saved-card-actions">
                        <button
                          className="gowra-saved-action-btn view-btn"
                          onClick={() => handleLoadSavedReport(r)}
                          title="Load this report onto the document sheet"
                        >
                          👁️ View / Load
                        </button>
                        <button
                          className="gowra-saved-action-btn delete-btn"
                          onClick={(e) => handleDeleteSavedReport(r.id, r.report_name, e)}
                          title="Delete saved report"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gowra-empty-saved-msg">
                  <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📂</span>
                  <strong>No saved reports found.</strong>
                  <p>When you edit a report, click "💾 Save Report" to save a snapshot for future viewing and downloads.</p>
                </div>
              )}
            </div>
            <div className="gowra-modal-footer">
              <button className="gowra-btn-secondary" onClick={() => setShowSavedListModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
