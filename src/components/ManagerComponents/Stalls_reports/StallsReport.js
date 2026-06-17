import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./StallsReport.css";
import * as XLSX from "xlsx-js-style";

export default function StallSalesReport() {
  const { user } = useAuth();
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [companyFilter, setCompanyFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stall");
  const [submitted, setSubmitted] = useState(false);
  const [includeEmail, setIncludeEmail] = useState(false);
  const [initialCompanies, setInitialCompanies] = useState([]);

  // Fetch stalls
  useEffect(() => {
    if (!user?.building_id) return;

    const fetchStalls = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
        );
        setStalls(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch outlets.");
      }
    };

    fetchStalls();
  }, [user]);

  // Fetch initial companies list from HRs
  useEffect(() => {
    if (!user?.building_id) return;

    const fetchInitialCompanies = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/hr/building/${user.building_id}`
        );
        const hrList = res.data?.hrs || [];
        const uniqueCompanies = Array.from(
          new Set(hrList.map((hr) => hr.company).filter(Boolean))
        );
        setInitialCompanies(uniqueCompanies);
      } catch (err) {
        console.error("Failed to fetch initial companies:", err);
      }
    };

    fetchInitialCompanies();
  }, [user]);

  // Fetch orders
  useEffect(() => {
    if (!user?.building_id || !submitted) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        let fetchedOrders = [];

        const fetchOrdersByStall = async (stall) => {
          const baseUrl = "https://admin-aged-field-2794.fly.dev/orders";
          let startDate, endDate;
          const now = new Date();

          const getUTCStartEndForISTDay = (date) => {
            const istDate = new Date(
              date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const istStart = new Date(istDate);
            istStart.setHours(0, 0, 0, 0);
            const istEnd = new Date(istStart);
            istEnd.setDate(istEnd.getDate() + 1);
            return { start: istStart.toISOString(), end: istEnd.toISOString() };
          };

          if (filter === "today") {
            ({ start: startDate, end: endDate } = getUTCStartEndForISTDay(now));
          } else if (filter === "week") {
            const istNow = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const startOfWeek = new Date(istNow);
            startOfWeek.setDate(istNow.getDate() - istNow.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(istNow);
            endOfWeek.setHours(23, 59, 59, 999);
            startDate = startOfWeek.toISOString();
            endDate = endOfWeek.toISOString();
          } else if (filter === "month") {
            const istNow = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
            );
            const startOfMonth = new Date(
              istNow.getFullYear(),
              istNow.getMonth(),
              1
            );
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(istNow);
            endOfMonth.setHours(23, 59, 59, 999);
            startDate = startOfMonth.toISOString();
            endDate = endOfMonth.toISOString();
          } else if (filter === "custom") {
            if (!customRange.start || !customRange.end) return [];
            const start = new Date(customRange.start + "T00:00:00");
            const end = new Date(customRange.end + "T23:59:59");
            startDate = start.toISOString();
            endDate = end.toISOString();
          } else {
            return [];
          }

          try {
            const res = await axios.get(`${baseUrl}/by-stall/${stall.id}/range`, {
              params: { start_date: startDate, end_date: endDate },
            });

            return res.data.map((order) => ({
              ...order,
              stall_name: stall.name,
              paymentType: order.paid_with_wallet ? "Postpaid" : "Prepaid",
            }));
          } catch (err) {
            if (err.response?.status === 404) return [];
            throw err;
          }
        };

        if (selectedStallId === "all") {
          for (let stall of stalls) {
            const stallOrders = await fetchOrdersByStall(stall);
            fetchedOrders.push(...stallOrders);
          }
        } else {
          const selectedStall = stalls.find((s) => s.id === selectedStallId);
          if (selectedStall) {
            const stallOrders = await fetchOrdersByStall(selectedStall);
            fetchedOrders.push(...stallOrders);
          }
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
        setOrders([]);
      } finally {
        setLoading(false);
        setSubmitted(false);
      }
    };

    fetchOrders();
  }, [user, stalls, submitted, filter, customRange, selectedStallId]);

  // Extract company name from email
  const getCompanyName = (email) => {
    if (!email) return "Unknown";
    return email.split("@")[1]?.split(".")[0] || "Unknown";
  };

  // Get all unique companies for dropdown
  const companies = Array.from(
    new Set([
      ...initialCompanies,
      ...orders.map((o) => getCompanyName(o.user_email))
    ])
  );

  // Apply company + payment filters
  const filteredOrders = orders.filter((order) => {
    const companyMatch = companyFilter === "all" || getCompanyName(order.user_email) === companyFilter;
    const paymentMatch = paymentFilter === "all" || order.paymentType === paymentFilter;
    return companyMatch && paymentMatch;
  });

  // Sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date") return new Date(a.created_datetime) - new Date(b.created_datetime);
    if (sortBy === "stall") return a.stall_name.localeCompare(b.stall_name);
    if (sortBy === "payment") return a.paymentType.localeCompare(b.paymentType);
    return 0;
  });

  const totalSales = sortedOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  const handleSubmit = () => {
    if (!filter) {
      alert("Please select a date filter (Today, Week, Month, or Custom)");
      return;
    }
    if (filter === "custom" && (!customRange.start || !customRange.end)) {
      alert("Please select both start and end dates for custom range.");
      return;
    }
    setSubmitted(true);
  };

const exportToExcel = () => {
  let totalNetAmount = 0;
  let totalGross = 0;
  let totalGST = 0;
  let totalRoundOff = 0;
  let totalPaidAll = 0;

  const rows = sortedOrders.flatMap((order) =>
    order.order_details.map((item, index) => {
      const netAmount = item.quantity * item.price;
      const totalPaid =
        order.order_details.reduce((sum, d) => sum + d.total, 0) +
        (order.round_off || 0);

      totalNetAmount += netAmount;
      totalGross += item.total;

      if (index === 0) {
        totalGST += order.total_gst || 0;
        totalRoundOff += order.round_off || 0;
        totalPaidAll += totalPaid;
      }

      const row = {
        Outlet: order.stall_name,
        Token: order.token_number,
        Date: new Date(order.created_datetime).toLocaleString("en-IN"),
      };

      if (includeEmail) {
        row["Email ID"] = order.user_email || "N/A";
      }

      Object.assign(row, {
        "Payment Type": order.paymentType,
        Item: item.name,
        Qty: item.quantity,
        Price: item.price,
        "Net Amount": netAmount.toFixed(2),
        "Gross Total": item.total.toFixed(2),
        GST: index === 0 ? (order.total_gst || 0).toFixed(2) : "",
        "Round Off": index === 0 ? (order.round_off || 0).toFixed(2) : "",
        "Total Paid": index === 0 ? totalPaid.toFixed(2) : "",
      });

      return row;
    })
  );

  const grandTotalRow = {
    Outlet: "",
    Token: "",
    Date: "",
  };

  if (includeEmail) {
    grandTotalRow["Email ID"] = "";
  }

  Object.assign(grandTotalRow, {
    "Payment Type": "",
    Item: "GRAND TOTAL",
    Qty: "",
    Price: "",
    "Net Amount": totalNetAmount.toFixed(2),
    "Gross Total": totalGross.toFixed(2),
    GST: totalGST.toFixed(2),
    "Round Off": totalRoundOff.toFixed(2),
    "Total Paid": totalPaidAll.toFixed(2),
  });

  rows.push(grandTotalRow);

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Outlet Sales Report");
  XLSX.writeFile(wb, "Outlet_Sales_Report.xlsx");
};

  // Calculate additional metrics
  const totalOrders = sortedOrders.length;
  const prepaidCount = sortedOrders.filter(o => o.paymentType === "Prepaid").length;
  const postpaidCount = sortedOrders.filter(o => o.paymentType === "Postpaid").length;
  const totalGST = sortedOrders.reduce((acc, order) => acc + (order.total_gst || 0), 0);

  return (
    <div className="stall-report-container-unique">
      {/* Header Section */}
      <div className="stall-report-header">
        <div className="stall-report-header-content">
          <h1 className="stall-report-title-unique">📊 Outlet Sales Report</h1>
          <p className="stall-report-subtitle">Comprehensive sales analytics and order management</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="stall-report-filters-card">
        <h3 className="filters-card-title">🔍 Filters & Options</h3>
        
        <div className="stall-report-filters-row-unique">
          {/* Outlet Filter */}
          <div className="stall-report-dropdown-unique">
            <label htmlFor="stall-select">Select Outlet</label>
            <select
              id="stall-select"
              value={selectedStallId}
              onChange={(e) => setSelectedStallId(e.target.value)}
            >
              <option value="all">All Outlets</option>
              {stalls.map((stall) => (
                <option key={stall.id} value={stall.id}>
                  {stall.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="stall-report-dropdown-unique">
            <label htmlFor="sort-select">Sort By</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="stall">Outlet</option>
              <option value="date">Date</option>
              <option value="payment">Payment Type</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="stall-report-dropdown-unique">
            <label htmlFor="payment-filter-select">Payment Type</label>
            <select
              id="payment-filter-select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Prepaid">Prepaid</option>
              <option value="Postpaid">Postpaid</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="stall-report-dropdown-unique">
            <label htmlFor="company-select">Company</label>
            <select
              id="company-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="stall-report-date-filter-section">
          <label htmlFor="date-filter-select" className="stall-report-date-label">Select Date Range</label>
          <div className="date-filter-controls">
            <select
              id="date-filter-select"
              className="stall-report-date-dropdown"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Choose Date Filter</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {filter === "custom" && (
              <div className="stall-report-custom-date-inputs">
                <input
                  type="date"
                  className="stall-report-date-dropdown"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, start: e.target.value })
                  }
                  placeholder="Start Date"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="stall-report-date-dropdown"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, end: e.target.value })
                  }
                  placeholder="End Date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Options */}
        <div className="stall-report-additional-options">
          <div className="stall-report-toggle-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={includeEmail}
                onChange={(e) => setIncludeEmail(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span className="stall-report-toggle-label" onClick={() => setIncludeEmail(!includeEmail)}>
              Include Employee Email ID
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="stall-report-submit-btn-container-unique">
          <button className="stall-report-submit-btn-unique" onClick={handleSubmit}>
            ⚡ Generate Report
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="stall-report-loading-state">
          <div className="spinner"></div>
          <p>Generating report...</p>
        </div>
      )}
      
      {error && (
        <div className="stall-report-error-state">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && sortedOrders.length === 0 && submitted && (
        <div className="stall-report-no-orders-unique">
          <p>📭 No orders found for the selected date range.</p>
        </div>
      )}

      {sortedOrders.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="stall-report-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h4>Total Sales</h4>
                <p className="metric-value">₹{totalSales.toFixed(2)}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📦</div>
              <div className="metric-content">
                <h4>Total Orders</h4>
                <p className="metric-value">{totalOrders}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💵</div>
              <div className="metric-content">
                <h4>Prepaid</h4>
                <p className="metric-value">{prepaidCount}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-content">
                <h4>Postpaid</h4>
                <p className="metric-value">{postpaidCount}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🧾</div>
              <div className="metric-content">
                <h4>Total GST</h4>
                <p className="metric-value">₹{totalGST.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Table Section Header */}
          <div className="stall-report-table-section-header">
            <h3>📋 Order Details</h3>
            <button className="stall-report-export-btn" onClick={exportToExcel}>
              📥 Export to Excel
            </button>
          </div>

          {/* Data Table */}
          <div className="stall-report-table-wrapper">
            <table className="stall-report-table-unique">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Token</th>
                  <th>Outlet</th>
                  {includeEmail && <th>Email ID</th>}
                  <th>Payment Type</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Net Amount</th>
                  <th>Gross Total</th>
                  <th>GST</th>
                  <th>Round Off</th>
                  <th>Total Paid</th>
                </tr>
              </thead>



<tbody>
                  {sortedOrders.map((order) =>
                    order.order_details.map((item, index) => {
                      const totalPaid =
                        order.order_details.reduce((sum, d) => sum + d.total, 0) +
                        (order.round_off || 0);

                      return (
                        <tr key={`${order.id}-${item.item_id}`}>
                          <td>
                            {new Date(order.created_datetime).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </td>
                          <td className="token-cell">{order.token_number}</td>
                          <td className="outlet-cell">{order.stall_name}</td>
                          {includeEmail && (
                            <td className="email-cell">
                              {order.user_email || "N/A"}
                            </td>
                          )}
                          <td>
                            <span className={`payment-badge ${order.paymentType.toLowerCase()}`}>
                              {order.paymentType}
                            </span>
                          </td>
                          <td>{item.name}</td>
                          <td className="qty-cell">{item.quantity}</td>
                          <td>₹{item.price}</td>
                          <td>₹{(item.quantity * item.price).toFixed(2)}</td>
                          <td>₹{item.total.toFixed(2)}</td>

                          {/* GST ONLY ON FIRST ITEM */}
                          <td>{index === 0 ? `₹${order.total_gst?.toFixed(2)}` : ""}</td>

                          {/* ROUND OFF ONLY ON FIRST ITEM */}
                          <td>{index === 0 ? `₹${order.round_off?.toFixed(2)}` : ""}</td>

                          {/* TOTAL PAID ONLY ON FIRST ITEM */}
                          <td className="total-paid-cell">{index === 0 ? `₹${totalPaid.toFixed(2)}` : ""}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>


            </table>
          </div>
        </>
      )}
    </div>
  );
}