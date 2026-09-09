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
  FiDollarSign,
  FiFileText,
  FiPercent,
  FiCheckCircle,
  FiX,
  FiClock,
} from "react-icons/fi";
import "./Reports.css";

const ReportsPage = () => {
  const { stallId } = useParams();
  const navigate = useNavigate();
  const { token } = useVendorAuth();

  const [orders, setOrders] = useState([]);
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= DATE HELPERS (TODAY) ================= */
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
  const fetchOrders = useCallback(async () => {
    if (!stallId || !token) return;

    const { start, end } = getTodayRange();
    setLoading(true);

    try {
      const res = await axios.get(
        `https://admin-aged-field-2794.fly.dev/orders/by-stall/${stallId}/range`,
        {
          params: { start_date: start, end_date: end },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data || [];
      setOrders(data);

      if (data.length && data[0].order_details?.length && !stallName) {
        setStallName(data[0].order_details[0].stall_name);
      }
    } catch (err) {
      console.error("❌ Error fetching reports:", err.message);
    } finally {
      setLoading(false);
    }
  }, [stallId, token, getTodayRange, stallName]);

  useEffect(() => {
    fetchOrders();
  }, [stallId, fetchOrders]);

  /* ================= FILTERED ORDERS (BY SEARCH) ================= */
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

  const totalNetAmount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + getOrderNetAmount(o), 0);
  }, [filteredOrders]);

  const totalGST = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total_gst || 0), 0);
  }, [filteredOrders]);

  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }, [filteredOrders]);

  /* ================= EXCEL EXPORT ================= */
  const handleExportExcel = () => {
    if (!filteredOrders.length) {
      alert("No order data to export.");
      return;
    }

    const exportRows = filteredOrders.map((o) => {
      const d = new Date(o.created_datetime);
      const itemsList = (o.order_details || [])
        .map((i) => `${i.name} (x${i.quantity}) - ₹${(i.price || 0) * (i.quantity || 1)}`)
        .join("; ");
      const net = getOrderNetAmount(o);

      return {
        "Token No": o.token_number || "-",
        "Date": d.toLocaleDateString(),
        "Time": d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        "Items Ordered": itemsList,
        "Net Amount (₹)": Number(net.toFixed(2)),
        "Total GST (₹)": Number((o.total_gst || 0).toFixed(2)),
        "Total Amount (₹)": Number((o.total_amount || 0).toFixed(2)),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Reports");

    const safeStallName = (stallName || "Stall").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = formatDate(new Date());
    XLSX.writeFile(workbook, `${safeStallName}_Sales_Report_Today_${dateStr}.xlsx`);
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
              <div className="reports-badge">Today's Reports</div>
              <h1 className="reports-title">{stallName || "Stall"} Reports</h1>
            </div>
          </div>

          <div className="reports-header-actions">
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
              disabled={loading || filteredOrders.length === 0}
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
              <FiDollarSign className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Revenue</span>
              <h3 className="stat-value">₹{totalAmount.toFixed(2)}</h3>
              <span className="stat-subtext">Total collection after GST</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper net-icon">
              <FiShoppingBag className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Net Sales</span>
              <h3 className="stat-value">₹{totalNetAmount.toFixed(2)}</h3>
              <span className="stat-subtext">Base item total</span>
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
              <h3 className="stat-value">{filteredOrders.length}</h3>
              <span className="stat-subtext">Today's total orders</span>
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
                                  <span className="item-subtotal">
                                    ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                  </span>
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
                <tfoot>
                  <tr className="table-totals-row">
                    <td colSpan="3" className="totals-label">
                      Summary Total ({filteredOrders.length} orders)
                    </td>
                    <td className="text-right cell-numeric">
                      ₹{totalNetAmount.toFixed(2)}
                    </td>
                    <td className="text-right cell-numeric">
                      ₹{totalGST.toFixed(2)}
                    </td>
                    <td className="text-right cell-numeric totals-grand-amount">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReportsPage;
