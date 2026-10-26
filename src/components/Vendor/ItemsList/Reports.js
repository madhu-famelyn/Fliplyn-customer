// src/pages/vendor/ReportsPage.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { useVendorAuth } from "../../AuthContex/VendorContext";
import TokenHeader from "../../LayOutComponents/PrintToken/Header";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiShoppingBag,
  FiFileText,
  FiPercent,
  FiCheckCircle,
  FiX,
  FiClock,
  FiCreditCard,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import "./Reports.css";

const ReportsPage = () => {
  const { stallId } = useParams();
  const navigate = useNavigate();
  const { token } = useVendorAuth();

  const [orders, setOrders] = useState([]);
  const [yesterdayOrders, setYesterdayOrders] = useState([]);
  const [statsOrders, setStatsOrders] = useState([]);
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("YESTERDAY"); // YESTERDAY | CUSTOM — drives KPI cards only
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  // Range actually used for the report; only updated when the vendor clicks Get Report
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  /* ================= DATE HELPERS ================= */
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTodayRange = useCallback(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 1);
    return { start: formatDate(today), end: formatDate(end) };
  }, []);

  // Vendors only see completed days in sales figures: today's sales unlock after midnight.
  // The API end date is inclusive at 00:00, so end = today covers all of yesterday and none of today.
  const getYesterdayRange = useCallback(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { start: formatDate(yesterday), end: formatDate(today) };
  }, []);

  const yesterdayStr = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const addDays = (dateStr, n) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return formatDate(new Date(y, m - 1, d + n));
  };
  // Max one month (31 days inclusive); today and future dates are not allowed
  const MAX_RANGE_DAYS = 31;
  const isCustomRangeValid =
    !!customStart &&
    !!customEnd &&
    customStart <= customEnd &&
    customEnd <= yesterdayStr &&
    customEnd <= addDays(customStart, MAX_RANGE_DAYS - 1);

  const getDateRange = useCallback(
    (filter) => {
      if (filter === "CUSTOM") {
        // API end date is exclusive of that day's orders, so send the day after the chosen end
        const [y, m, d] = appliedEnd.split("-").map(Number);
        return { start: appliedStart, end: formatDate(new Date(y, m - 1, d + 1)) };
      }
      return getYesterdayRange();
    },
    [appliedStart, appliedEnd, getYesterdayRange]
  );

  const dateFilterLabel =
    dateFilter === "CUSTOM"
      ? appliedStart === appliedEnd
        ? `${appliedStart}'s`
        : `${appliedStart} to ${appliedEnd}`
      : "Yesterday's";

  /* ================= FETCH STALL NAME ================= */
  useEffect(() => {
    if (!stallId || !token) return;

    const fetchStallInfo = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.name) {
          setStallName(res.data.name);
        }
      } catch (err) {
        console.error("Error fetching stall info:", err);
      }
    };

    fetchStallInfo();
  }, [stallId, token]);

  /* ================= FETCH ORDERS ================= */
  // Table always stays on today's orders; KPI cards follow the selected date filter
  const fetchOrdersInRange = useCallback(
    async (range) => {
      const res = await axios.get(
        `https://admin-aged-field-2794.fly.dev/orders/by-stall/${stallId}/range`,
        {
          params: { start_date: range.start, end_date: range.end },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data || [];
    },
    [stallId, token]
  );

  const fetchOrders = useCallback(async () => {
    if (!stallId || !token) return;
    if (dateFilter === "CUSTOM" && (!appliedStart || !appliedEnd)) return;

    setLoading(true);

    try {
      const [todayData, yesterdayData, statsData] = await Promise.all([
        fetchOrdersInRange(getTodayRange()),
        fetchOrdersInRange(getYesterdayRange()),
        fetchOrdersInRange(getDateRange(dateFilter)),
      ]);

      // The API end date is inclusive at 00:00, so drop anything stamped today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const beforeToday = (list) =>
        list.filter((o) => new Date(o.created_datetime) < startOfToday);

      setOrders(todayData);
      setYesterdayOrders(beforeToday(yesterdayData));
      setStatsOrders(beforeToday(statsData));

      const sample = todayData[0] || statsData[0];
      if (sample?.order_details?.length && !stallName) {
        setStallName(sample.order_details[0].stall_name);
      }
    } catch (err) {
      console.error("❌ Error fetching reports:", err.message);
    } finally {
      setLoading(false);
    }
  }, [stallId, token, dateFilter, appliedStart, appliedEnd, getTodayRange, getYesterdayRange, getDateRange, fetchOrdersInRange, stallName]);

  useEffect(() => {
    fetchOrders();
  }, [stallId, dateFilter, fetchOrders]);

  /* ================= FILTERED ORDERS (TODAY, BY SEARCH) ================= */
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.toLowerCase().trim();

    return orders.filter((o) => {
      const matchToken = o.token_number?.toLowerCase().includes(q);
      const matchItems = o.order_details?.some((i) =>
        i.name?.toLowerCase().includes(q)
      );
      return matchToken || matchItems;
    });
  }, [orders, searchTerm]);

  /* ================= CALCULATIONS ================= */
  const getOrderNetAmount = (order) =>
    (order.order_details || []).reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
      0
    );

  const totalGST = useMemo(() => {
    return statsOrders.reduce((sum, o) => sum + (o.total_gst || 0), 0);
  }, [statsOrders]);

  /* ================= PREPAID / POSTPAID SPLIT ================= */
  // Same rule as the manager summary: only group-funded wallet orders are postpaid
  const isPostpaidOrder = (order) => !!order.paid_with_wallet && !order.is_self_funded_wallet;

  const prepaidOrders = useMemo(
    () => statsOrders.filter((o) => !isPostpaidOrder(o)),
    [statsOrders]
  );
  const postpaidOrders = useMemo(
    () => statsOrders.filter((o) => isPostpaidOrder(o)),
    [statsOrders]
  );

  const prepaidTotal = useMemo(
    () => prepaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [prepaidOrders]
  );
  const postpaidTotal = useMemo(
    () => postpaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [postpaidOrders]
  );

  // Total revenue = prepaid after 3% deduction + postpaid
  const prepaidAfterDeduction = useMemo(
    () => prepaidTotal - Number((prepaidTotal * 0.03).toFixed(2)),
    [prepaidTotal]
  );
  const totalRevenue = prepaidAfterDeduction + postpaidTotal;
  const netSalesAfterDeduction = totalRevenue - totalGST;

  /* ================= EXCEL EXPORT (yesterday's completed sales) ================= */
  const handleExportExcel = () => {
    if (!yesterdayOrders.length) {
      alert("No order data to export.");
      return;
    }

    const exportRows = yesterdayOrders.map((o) => {
      const d = new Date(o.created_datetime);
      const itemsList = (o.order_details || [])
        .map((i) => `${i.name} (x${i.quantity}) - ₹${(i.price || 0) * (i.quantity || 1)}`)
        .join("; ");
      const net = getOrderNetAmount(o);
      const deduction = isPostpaidOrder(o) ? 0 : (o.total_amount || 0) * 0.03;

      return {
        "Token No": o.token_number || "-",
        "Date": d.toLocaleDateString(),
        "Time": d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        "Items Ordered": itemsList,
        "Payment Type": isPostpaidOrder(o) ? "Postpaid" : "Prepaid",
        "Net Amount (₹)": Number(net.toFixed(2)),
        "Deduction 3% (₹)": Number(deduction.toFixed(2)),
        "Net After Deduction (₹)": Number(((o.total_amount || 0) - deduction - (o.total_gst || 0)).toFixed(2)),
        "Total GST (₹)": Number((o.total_gst || 0).toFixed(2)),
        "Total Amount (₹)": Number((o.total_amount || 0).toFixed(2)),
      };
    });

    // Totals are computed on the aggregate (not by summing rounded rows) to match the manager summary
    const prepaidGross = yesterdayOrders
      .filter((o) => !isPostpaidOrder(o))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalDeduction = Number((prepaidGross * 0.03).toFixed(2));
    const exportNet = yesterdayOrders.reduce((sum, o) => sum + getOrderNetAmount(o), 0);
    const exportGST = yesterdayOrders.reduce((sum, o) => sum + (o.total_gst || 0), 0);
    const exportTotal = yesterdayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    exportRows.push({
      "Token No": "TOTAL",
      "Date": "",
      "Time": "",
      "Items Ordered": `${yesterdayOrders.length} orders`,
      "Payment Type": "",
      "Net Amount (₹)": Number(exportNet.toFixed(2)),
      "Deduction 3% (₹)": totalDeduction,
      "Net After Deduction (₹)": Number((exportTotal - totalDeduction - exportGST).toFixed(2)),
      "Total GST (₹)": Number(exportGST.toFixed(2)),
      "Total Amount (₹)": Number(exportTotal.toFixed(2)),
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Reports");

    const safeStallName = (stallName || "Stall").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = getYesterdayRange().start;
    XLSX.writeFile(workbook, `${safeStallName}_Sales_Report_${dateStr}.xlsx`);
  };

  /* ================= UI ================= */
  return (
    <div className="reports-page-wrapper">
      <TokenHeader />

      <div className="reports-container">
        {/* TOP HEADER CARD */}
        <header className="reports-header-card">
          <div className="reports-header-left">
            <button
              className="reports-back-btn"
              onClick={() => navigate(stallId ? `/items-vendor/${stallId}` : "/vendor-stall")}
              title="Back to Stall"
            >
              <FiArrowLeft className="btn-icon" />
              <span>Back to Stall</span>
            </button>
            <div className="reports-title-area">
              <div className="reports-badge">Reports</div>
              <h1 className="reports-title">{stallName || "Stall"} Reports</h1>
            </div>
          </div>

          <div className="reports-header-actions">
            <select
              className="reports-date-filter-select"
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "CUSTOM" && !customStart && !customEnd) {
                  setCustomStart(yesterdayStr);
                  setCustomEnd(yesterdayStr);
                  setAppliedStart(yesterdayStr);
                  setAppliedEnd(yesterdayStr);
                }
                setDateFilter(value);
              }}
              disabled={loading}
              title="Select KPI period"
            >
              <option value="YESTERDAY">Yesterday</option>
              <option value="CUSTOM">Custom Date</option>
            </select>

            {dateFilter === "CUSTOM" && (
              <div className="reports-custom-range">
                <input
                  type="date"
                  className="reports-date-input"
                  value={customStart}
                  min={customEnd ? addDays(customEnd, -(MAX_RANGE_DAYS - 1)) : undefined}
                  max={customEnd || yesterdayStr}
                  onChange={(e) => setCustomStart(e.target.value)}
                  disabled={loading}
                  title="From date"
                />
                <span className="reports-date-sep">to</span>
                <input
                  type="date"
                  className="reports-date-input"
                  value={customEnd}
                  min={customStart || undefined}
                  max={
                    customStart && addDays(customStart, MAX_RANGE_DAYS - 1) < yesterdayStr
                      ? addDays(customStart, MAX_RANGE_DAYS - 1)
                      : yesterdayStr
                  }
                  onChange={(e) => setCustomEnd(e.target.value)}
                  disabled={loading}
                  title="To date"
                />
                {!isCustomRangeValid && customStart && customEnd && (
                  <span className="reports-date-error">Select up to 31 days, ending yesterday</span>
                )}
                <button
                  className="reports-btn-primary"
                  onClick={() => {
                    setAppliedStart(customStart);
                    setAppliedEnd(customEnd);
                  }}
                  disabled={loading || !isCustomRangeValid}
                  title="Load report for the selected dates"
                >
                  <span>Get Report</span>
                </button>
              </div>
            )}

            <button
              className="reports-btn-secondary"
              onClick={fetchOrders}
              disabled={loading}
              title="Refresh Data"
            >
              <FiRefreshCw className={`btn-icon ${loading ? "spinning" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              className="reports-btn-primary"
              onClick={handleExportExcel}
              disabled={loading || yesterdayOrders.length === 0}
              title="Export report to Excel"
            >
              <FiDownload className="btn-icon" />
              <span>Export Excel</span>
            </button>
          </div>
        </header>

        {/* KPI STAT CARDS */}
        <section className="reports-stats-grid">
          <div className="stat-card stat-card-revenue">
            <div className="stat-icon-wrapper revenue-icon">
              <FaRupeeSign className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Revenue</span>
              <h3 className="stat-value">₹{totalRevenue.toFixed(2)}</h3>
              <span className="stat-subtext">
                {dateFilter === "CUSTOM" ? `For ${dateFilterLabel.replace(/'s$/, "")}` : "As on Yesterday"}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper net-icon">
              <FiShoppingBag className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Net Sales</span>
              <h3 className="stat-value">₹{netSalesAfterDeduction.toFixed(2)}</h3>
              <span className="stat-subtext"></span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper gst-icon">
              <FiPercent className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total GST</span>
              <h3 className="stat-value">₹{totalGST.toFixed(2)}</h3>
              <span className="stat-subtext">Tax collected (5%)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper orders-icon">
              <FiCheckCircle className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Orders</span>
              <h3 className="stat-value">{statsOrders.length}</h3>
              <span className="stat-subtext">{dateFilterLabel} total orders</span>
            </div>
          </div>

          <div className="stat-card stat-card-payment-split">
            <div className="stat-icon-wrapper prepaid-icon">
              <FiCreditCard className="stat-icon" />
            </div>
            <div className="stat-info stat-info-split">
              <span className="stat-label">Prepaid &amp; Postpaid</span>
              <div className="stat-split-row">
                <div className="stat-split-item">
                  <span className="stat-split-value payment-prepaid-text">
                    ₹{prepaidAfterDeduction.toFixed(2)}
                  </span>
                  <span className="stat-subtext">{prepaidOrders.length} Prepaid orders</span>
                </div>
                <div className="stat-split-divider" />
                <div className="stat-split-item">
                  <span className="stat-split-value payment-postpaid-text">
                    ₹{postpaidTotal.toFixed(2)}
                  </span>
                  <span className="stat-subtext">{postpaidOrders.length} Postpaid orders</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH BAR SECTION */}
        <section className="reports-filter-section">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search token number or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
              >
                <FiX />
              </button>
            )}
          </div>
        </section>

        {/* DATA TABLE / CONTENT */}
        <section className="reports-table-card">
          <div className="table-card-header">
            <div className="table-header-title">
              <h2>Orders & Transactions</h2>
              <span className="table-count-badge">
                {filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="reports-loading-state">
              <div className="spinner"></div>
              <p>Fetching sales records...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="reports-empty-state">
              <div className="empty-icon-circle">
                <FiFileText className="empty-icon" />
              </div>
              <h3>No Orders Found</h3>
              <p>
                {searchTerm
                  ? "No orders match your search query."
                  : "No orders found for today."}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  className="empty-reset-btn"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="table-scroll-container">
              <table className="modern-reports-table">
                <thead>
                  <tr>
                    <th className="col-token">Token</th>
                    <th className="col-datetime">Date & Time</th>
                    <th className="col-items">Items & Details</th>
                    <th className="col-amount text-right">Net Amount</th>
                    <th className="col-gst text-right">GST</th>
                    <th className="col-total text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const d = new Date(o.created_datetime);
                    const netAmount = getOrderNetAmount(o);

                    return (
                      <tr key={o.id} className="report-row">
                        <td className="col-token">
                          <span className="token-badge">{o.token_number || "-"}</span>
                        </td>

                        <td className="col-datetime">
                          <div className="datetime-cell">
                            <span className="cell-date">
                              {d.toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="cell-time">
                              <FiClock className="time-icon" />
                              {d.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="col-items">
                          <div className="items-list-cell">
                            {o.order_details && o.order_details.length > 0 ? (
                              o.order_details.map((item, idx) => (
                                <div key={idx} className="item-row-entry">
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-qty">× {item.quantity}</span>
                                </div>
                              ))
                            ) : (
                              <span className="no-items">-</span>
                            )}
                          </div>
                        </td>

                        <td className="col-amount text-right cell-numeric">
                          ₹{netAmount.toFixed(2)}
                        </td>

                        <td className="col-gst text-right cell-numeric">
                          ₹{(o.total_gst || 0).toFixed(2)}
                        </td>

                        <td className="col-total text-right cell-numeric cell-total">
                          ₹{(o.total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
