import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContex/ContextAPI";
import { exportSheetToPdf } from "../../../utils/exportSheetToPdf";
import "../DailyOrderSummary/DailyOrderSummaryReport.css";
import "./DailySummaryReport.css";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://admin-aged-field-2794.fly.dev");

const NUMBER_FIELDS = ["no_of_orders", "net_amount", "discount", "charges", "tax", "round_off", "total_amount"];

const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatNumber = (val) => {
  if (val === null || val === undefined || val === "") return "0.0";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num % 1 === 0 ? `${num}.0` : num.toFixed(2);
};

let keyCounter = 0;
const blankRow = () => ({
  _key: `new-${(keyCounter += 1)}`,
  id: null,
  date: "",
  no_of_orders: "",
  net_amount: "",
  discount: "",
  charges: "",
  tax: "",
  round_off: "",
  total_amount: "",
});

const hasContent = (row) => !!row.date || NUMBER_FIELDS.some((f) => row[f] !== "" && row[f] !== null);

const ENTRY_COLUMNS = [
  { key: "date", label: "Date", type: "date" },
  { key: "no_of_orders", label: "No. of Orders", type: "number", step: "1" },
  { key: "net_amount", label: "Net Amount", type: "number", step: "0.01" },
  { key: "discount", label: "Discount", type: "number", step: "0.01" },
  { key: "charges", label: "Charges", type: "number", step: "0.01" },
  { key: "tax", label: "Tax", type: "number", step: "0.01" },
  { key: "round_off", label: "Round Off", type: "number", step: "0.01" },
  { key: "total_amount", label: "Total Amount", type: "number", step: "0.01" },
];

export default function DailySummaryReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const today = new Date();
  const [startDate, setStartDate] = useState(toDateString(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toDateString(today));

  // Header values the OM can type over directly on the sheet
  const [title, setTitle] = useState("Order Summary");
  const [businessName, setBusinessName] = useState("");
  const [summaryBy, setSummaryBy] = useState("DAY");
  const [periodLabel, setPeriodLabel] = useState("");
  const [generatedOn, setGeneratedOn] = useState("");
  const [generatedBy, setGeneratedBy] = useState("Sai Ram");

  const [rows, setRows] = useState([]);
  const [hasReport, setHasReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Manual entry form
  const [draftRows, setDraftRows] = useState([blankRow()]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const buildingId = user?.building_id;

  // Loads the saved entries for the selected dates into the report and the entry form
  const loadReport = async (keepUnsaved) => {
    if (!buildingId) {
      setErrorMsg("Building not found for this login.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Please select both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      setErrorMsg("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await axios.get(`${API_BASE}/orders/daily-summary-entries`, {
        params: {
          building_id: buildingId,
          start_date: startDate,
          end_date: endDate,
          generated_by: generatedBy || "Sai Ram",
        },
      });
      const data = res.data || {};

      // Newest date first
      const sorted = [...(data.rows || [])].sort((a, b) =>
        String(b.date_iso || "").localeCompare(String(a.date_iso || ""))
      );

      setRows(sorted);
      setBusinessName(data.business_name || "");
      setSummaryBy(data.summary_by || "DAY");
      setPeriodLabel(data.period || "");
      setGeneratedOn(data.report_generated_on || "");
      setHasReport(true);

      const saved = sorted.map((r) => ({
        _key: r.id,
        id: r.id,
        date: r.date_iso,
        no_of_orders: r.no_of_orders,
        net_amount: r.net_amount,
        discount: r.discount,
        charges: r.charges,
        tax: r.tax,
        round_off: r.round_off,
        total_amount: r.total_amount,
      }));
      setDraftRows((prev) => {
        const unsaved = keepUnsaved ? prev.filter((r) => !r.id && hasContent(r)) : [];
        const next = [...saved, ...unsaved];
        return next.length > 0 ? next : [blankRow()];
      });
      setDeletedIds([]);
    } catch (err) {
      console.error("Error loading daily summary report:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show the current month's saved entries when the page opens
  useEffect(() => {
    if (buildingId) loadReport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const updateDraft = (key, field, value) => {
    setDraftRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  };

  const removeDraft = (row) => {
    if (row.id) setDeletedIds((prev) => [...prev, row.id]);
    setDraftRows((prev) => {
      const next = prev.filter((r) => r._key !== row._key);
      return next.length > 0 ? next : [blankRow()];
    });
  };

  const handleSave = async () => {
    if (!buildingId) {
      setErrorMsg("Building not found for this login.");
      return;
    }

    const filled = draftRows.filter(hasContent);
    const seen = new Set();
    for (const r of filled) {
      if (!r.date) {
        setErrorMsg("Every row needs a date.");
        return;
      }
      if (seen.has(r.date)) {
        setErrorMsg(`The date ${r.date} is entered more than once.`);
        return;
      }
      seen.add(r.date);
    }
    if (filled.length === 0 && deletedIds.length === 0) {
      setErrorMsg("Nothing to save.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSaveMsg("");
    try {
      for (const id of deletedIds) {
        await axios.delete(`${API_BASE}/orders/daily-summary-entries/${id}`, {
          params: { building_id: buildingId },
        });
      }
      if (filled.length > 0) {
        await axios.post(`${API_BASE}/orders/daily-summary-entries`, {
          building_id: buildingId,
          entries: filled.map((r) => ({
            date: r.date,
            no_of_orders: r.no_of_orders,
            net_amount: r.net_amount,
            discount: r.discount,
            charges: r.charges,
            tax: r.tax,
            round_off: r.round_off,
            total_amount: r.total_amount,
          })),
        });
      }

      const outsideRange = filled.some((r) => r.date < startDate || r.date > endDate);
      await loadReport(false);
      setSaveMsg(
        outsideRange
          ? "Saved. Dates outside the selected range are not shown in the report below."
          : "Saved. The report below is updated."
      );
    } catch (err) {
      console.error("Error saving daily summary entries:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !hasReport) {
      alert("Generate the report first.");
      return;
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    setExportingPdf(true);
    try {
      // Let the blur above commit any in-progress edit before the sheet is copied
      await new Promise((resolve) => setTimeout(resolve, 50));
      const safeName = (businessName || "Daily_Summary").replace(/[^a-zA-Z0-9_-]/g, "_");
      await exportSheetToPdf(reportRef.current, `${safeName}_Daily_Summary_Report.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const editable = (value, setter, hint) => ({
    className: "dsr-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: (e) => setter(e.currentTarget.innerText.trim()),
    title: hint,
    children: value,
  });

  return (
    <div className="daily-summary-page-container">
      <div className="daily-summary-controls-card no-print">
        <div className="daily-summary-controls-left">
          <button
            className="daily-summary-back-btn"
            onClick={() => navigate("/manager-stalls")}
            title="Back to Outlets Dashboard"
          >
            ← Back
          </button>

          <input
            type="date"
            className="daily-summary-date-input"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            title="From date"
          />
          <span className="dsr-date-sep">to</span>
          <input
            type="date"
            className="daily-summary-date-input"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            title="To date"
          />

          <button className="daily-summary-btn-primary" onClick={() => loadReport(true)} disabled={loading}>
            {loading ? "Loading…" : "Generate Report"}
          </button>
        </div>

        <div className="daily-summary-controls-right">
          <button
            className="daily-summary-btn-print"
            onClick={handleDownloadPDF}
            disabled={exportingPdf || !hasReport}
            title="Download the report as PDF"
          >
            {exportingPdf ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      {errorMsg && <div className="dsr-error no-print">{errorMsg}</div>}
      {saveMsg && <div className="dsr-success no-print">{saveMsg}</div>}

      {/* ── Manual entry form ── */}
      <div className="dsr-entry-card no-print">
        <div className="dsr-entry-header">
          <h3>Enter Daily Data</h3>
          <span>Type the figures for each date and click Save. Saved dates appear in the report below.</span>
        </div>

        <div className="dsr-entry-table-wrapper">
          <table className="dsr-entry-table">
            <thead>
              <tr>
                {ENTRY_COLUMNS.map((c) => (
                  <th key={c.key} className={`dsr-col-${c.key}`}>{c.label}</th>
                ))}
                <th className="dsr-col-remove" aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {draftRows.map((row) => (
                <tr key={row._key}>
                  {ENTRY_COLUMNS.map((c) => (
                    <td key={c.key}>
                      <input
                        type={c.type}
                        step={c.step}
                        min={c.type === "number" ? "0" : undefined}
                        className="dsr-entry-input"
                        value={row[c.key]}
                        onChange={(e) => updateDraft(row._key, c.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="dsr-entry-remove"
                      onClick={() => removeDraft(row)}
                      title="Remove this row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dsr-entry-actions">
          <button
            className="daily-summary-btn-secondary"
            onClick={() => setDraftRows((prev) => [...prev, blankRow()])}
          >
            + Add Row
          </button>
          <button className="daily-summary-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Report sheet ── */}
      <div className="daily-summary-document-sheet" ref={reportRef}>
        {loading ? (
          <div className="daily-summary-loader-wrapper">
            <div className="daily-summary-spinner" />
            <span style={{ fontSize: "14px", color: "#64748b" }}>Generating report…</span>
          </div>
        ) : hasReport ? (
          <>
            <h1 className="daily-summary-doc-title">
              <span {...editable(title, setTitle, "Click to edit the title")} />
            </h1>

            <div className="daily-summary-meta-block">
              <div className="daily-summary-meta-row">
                <span className="daily-summary-meta-label">Business Name:</span>
                <span className="daily-summary-meta-value">
                  <span {...editable(businessName, setBusinessName, "Click to edit")} />
                </span>
              </div>
              <div className="daily-summary-meta-row">
                <span className="daily-summary-meta-label">Summary By:</span>
                <span className="daily-summary-meta-value">
                  <span {...editable(summaryBy, setSummaryBy, "Click to edit")} />
                </span>
              </div>
              <div className="daily-summary-meta-row">
                <span className="daily-summary-meta-label">Period:</span>
                <span className="daily-summary-meta-value">
                  <span {...editable(periodLabel, setPeriodLabel, "Click to edit")} />
                </span>
              </div>
              <div className="daily-summary-meta-row">
                <span className="daily-summary-meta-label">Report Generated On:</span>
                <span className="daily-summary-meta-value">
                  <span {...editable(generatedOn, setGeneratedOn, "Click to edit")} />
                </span>
              </div>
              <div className="daily-summary-meta-row">
                <span className="daily-summary-meta-label">Report Generated By:</span>
                <span className="daily-summary-meta-value">
                  <span {...editable(generatedBy, setGeneratedBy, "Click to edit")} />
                </span>
              </div>
            </div>

            <div className="daily-summary-table-wrapper">
              <table className="daily-summary-report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>No. of Orders</th>
                    <th>Net Amount</th>
                    <th>Discount</th>
                    <th>Charges</th>
                    <th>Tax</th>
                    <th>Round Off</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.no_of_orders}</td>
                        <td>{formatNumber(row.net_amount)}</td>
                        <td>{formatNumber(row.discount)}</td>
                        <td>{formatNumber(row.charges)}</td>
                        <td>{formatNumber(row.tax)}</td>
                        <td>{formatNumber(row.round_off)}</td>
                        <td>{formatNumber(row.total_amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="daily-summary-empty-msg">
                        No data entered for these dates yet. Use "Enter Daily Data" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="daily-summary-empty-msg">
            Select the dates and click "Generate Report".
          </div>
        )}
      </div>
    </div>
  );
}
