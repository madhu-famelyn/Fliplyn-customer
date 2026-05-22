import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  const [sortOrder, setSortOrder] = useState("AZ");
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const circlesRef = useRef(null);

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

  const getLastMonth = useCallback(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return [formatDate(start), formatDate(end)];
  }, []);

  const resolveDates = useCallback(() => {
    if (dateFilter === "TODAY") return getToday();
    if (dateFilter === "WEEK") return getWeek();
    if (dateFilter === "MONTH") return getMonth();
    if (dateFilter === "LAST_MONTH") return getLastMonth();

    return getToday(); // fallback safety
  }, [dateFilter, getToday, getWeek, getMonth, getLastMonth]);

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

      const normalized = (res.data?.stalls || []).map((s) => ({
        stall_id: s.stall_id,
        stall_name: s.stall_name,
        prepaid_net: s.prepaid_after_deduction || 0,
        prepaid_gross: s.prepaid_total_amount || 0,
        postpaid_net: s.postpaid_net_amount || 0,
        postpaid_gross: s.postpaid_total_amount || 0,
        prepaid_order_count: s.prepaid_order_count || 0,
        postpaid_order_count: s.postpaid_order_count || 0,
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
        acc.postpaid_net += item.postpaid_net;
        return acc;
      },
      {
        prepaid_net: 0,
        postpaid_net: 0,
      }
    );
  }, [sortedSales]);

  /* EXPORT */

  const exportExcel = () => {
    const data = sortedSales.map((s) => ({
      Outlet: s.stall_name,
      "Prepaid Net": s.prepaid_net,
      "Postpaid Net": s.postpaid_net,
    }));

    if (totals) {
      data.push({
        Outlet: "Total",
        "Prepaid Net": totals.prepaid_net,
        "Postpaid Net": totals.postpaid_net,
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Summary");
    XLSX.writeFile(wb, "Outlet_Sales_Report.xlsx");
  };

  // Calculate today's sales for the stats card
  const todaysSalesTotal = totals.prepaid_net + totals.postpaid_net;
  const todaysOrderCount = sortedSales.length;

  // Calculate sales for different periods
  const calculatePeriodSales = useCallback(async (startDate, endDate) => {
    if (!stallIds || stallIds.length === 0) return { net: 0, orders: 0 };

    try {
      // Fetch individual orders to get accurate order count
      const allOrders = [];

      for (const stallId of stallIds) {
        try {
          const res = await axios.get(
            `${API_BASE}/orders/by-stall/${stallId}/range`,
            {
              params: {
                start_date: `${startDate}T00:00:00`,
                end_date: `${endDate}T23:59:59`,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const orders = res.data || [];
          allOrders.push(...orders);
        } catch (error) {
          console.error(`Error fetching orders for stall ${stallId}:`, error);
        }
      }

      // Get net amount from sales-summary API
      const url =
        `${API_BASE}/orders/sales-summary/updated` +
        `?stall_ids=${stallIds.join(",")}` +
        `&start_date=${startDate}T00:00:00` +
        `&end_date=${endDate}T23:59:59`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const stalls = res.data?.stalls || [];
      const totalNet = stalls.reduce((sum, s) => sum + (s.prepaid_after_deduction + s.postpaid_net_amount || 0), 0);
      const totalOrders = allOrders.length;

      console.log("Period Sales - Orders:", totalOrders, "Net:", totalNet);
      return { net: totalNet, orders: totalOrders };
    } catch (err) {
      console.error("Period sales calculation error:", err);
      return { net: 0, orders: 0 };
    }
  }, [stallIds, token]);

  const [periodSales, setPeriodSales] = useState({
    today: { net: 0, orders: 0 },
    thisWeek: { net: 0, orders: 0 },
    thisMonth: { net: 0, orders: 0 },
  });

  useEffect(() => {
    const fetchPeriodSales = async () => {
      const today = new Date();
      const todayStr = formatDate(today);

      // Today
      const todayData = await calculatePeriodSales(todayStr, todayStr);

      // This Week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const thisWeekData = await calculatePeriodSales(formatDate(weekStart), todayStr);

      // This Month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthData = await calculatePeriodSales(formatDate(monthStart), todayStr);

      setPeriodSales({
        today: todayData,
        thisWeek: thisWeekData,
        thisMonth: thisMonthData,
      });
    };

    fetchPeriodSales();
  }, [calculatePeriodSales, fetchSalesSummary]);

  // Fetch order history for selected period
  const fetchOrderHistory = useCallback(async (period) => {
    if (!stallIds || stallIds.length === 0) return;

    const today = new Date();
    let startDate, endDate;

    if (period === "daily") {
      startDate = formatDate(today);
      endDate = formatDate(today);
    } else if (period === "weekly") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      startDate = formatDate(weekStart);
      endDate = formatDate(today);
    } else if (period === "monthly") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = formatDate(monthStart);
      endDate = formatDate(today);
    }

    try {
      setLoadingHistory(true);

      // Fetch orders for each stall and combine
      const allOrders = [];

      for (const stallId of stallIds) {
        try {
          const res = await axios.get(
            `${API_BASE}/orders/by-stall/${stallId}/range`,
            {
              params: {
                start_date: `${startDate}T00:00:00`,
                end_date: `${endDate}T23:59:59`,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const orders = res.data || [];
          allOrders.push(...orders);
        } catch (error) {
          console.error(`Error fetching orders for stall ${stallId}:`, error);
        }
      }

      setOrderHistory(allOrders);
      console.log("Order history fetched:", allOrders, "Total orders:", allOrders.length);
      if (allOrders.length > 0) {
        console.log("First order structure:", allOrders[0]);
        console.log("First order keys:", Object.keys(allOrders[0]));
        console.log("First order JSON:", JSON.stringify(allOrders[0], null, 2));
      }
    } catch (err) {
      console.error("Order history fetch error:", err);
      setOrderHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [stallIds, token]);

  // Fetch order history when period changes
  useEffect(() => {
    fetchOrderHistory(selectedPeriod);
  }, [selectedPeriod, fetchOrderHistory]);





  const handleViewOrderSummary = () => {
    if (circlesRef.current) {
      circlesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="vendor-dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Sales Dashboard</h1>
          <p className="header-subtitle">Track your outlet performance</p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="date-filter-select"
        >
          <option value="TODAY">Today</option>
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="LAST_MONTH">Last Month</option>
        </select>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>Total Outlets</h4>
            <p className="stat-value">{todaysOrderCount}</p>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h4>Today's Sales</h4>
            <p className="stat-value">₹{todaysSalesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <h4>Prepaid Net</h4>
            <p className="stat-value">₹{totals.prepaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h4>Postpaid Net</h4>
            <p className="stat-value">₹{totals.postpaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* SALES PERFORMANCE SECTION */}
      <div className="sales-performance-section">
        <h2 className="section-title">Outlet Performance</h2>

        <button onClick={handleViewOrderSummary} className="view-summary-link">📊 View Order Summary</button>

        {/* CIRCULAR SALES CARDS */}
        <div className="sales-circles-container" ref={circlesRef}>
          <div className="sales-circle-card">
            <div className="circle-content">
              <div className="circle-amount">₹{(periodSales.today.net).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="circle-orders">{periodSales.today.orders} orders</div>
            </div>
            <div className="circle-label">Today</div>
          </div>

          <div className="sales-circle-card">
            <div className="circle-content">
              <div className="circle-amount">₹{(periodSales.thisWeek.net).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="circle-orders">{periodSales.thisWeek.orders} orders</div>
            </div>
            <div className="circle-label">Weekly</div>
          </div>

          <div className="sales-circle-card">
            <div className="circle-content">
              <div className="circle-amount">₹{(periodSales.thisMonth.net).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="circle-orders">{periodSales.thisMonth.orders} orders</div>
            </div>
            <div className="circle-label">Monthly</div>
          </div>
        </div>

        {/* ORDER HISTORY TABS */}
        <div className="order-history-section">
          <h3 className="order-history-title">Order History</h3>

          <div className="order-tabs">
            <button
              className={`order-tab ${selectedPeriod === "daily" ? "active" : ""}`}
              onClick={() => {
                if (selectedPeriod === "daily" && showOrderHistory) {
                  setShowOrderHistory(false);
                } else {
                  setSelectedPeriod("daily");
                  setShowOrderHistory(true);
                }
              }}
            >
              📅 Daily
            </button>
            <button
              className={`order-tab ${selectedPeriod === "weekly" ? "active" : ""}`}
              onClick={() => {
                if (selectedPeriod === "weekly" && showOrderHistory) {
                  setShowOrderHistory(false);
                } else {
                  setSelectedPeriod("weekly");
                  setShowOrderHistory(true);
                }
              }}
            >
              📊 Weekly
            </button>
            <button
              className={`order-tab ${selectedPeriod === "monthly" ? "active" : ""}`}
              onClick={() => {
                if (selectedPeriod === "monthly" && showOrderHistory) {
                  setShowOrderHistory(false);
                } else {
                  setSelectedPeriod("monthly");
                  setShowOrderHistory(true);
                }
              }}
            >
              📈 Monthly
            </button>
          </div>

          {showOrderHistory && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0 }}>Orders</h4>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '5px 10px'
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              {loadingHistory ? (
                <div className="loading-container">
                  <div className="loader-spinner"></div>
                  <p>Loading order history...</p>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="empty-state">
                  <p>No orders found for this period</p>
                </div>
              ) : (
                <div className="order-history-list">
                  <div className="order-history-header">
                    <div className="order-history-header-item">Outlet</div>
                    <div className="order-history-header-item">Orders</div>
                    <div className="order-history-header-item">Net Amount</div>
                  </div>
                  {orderHistory.map((order, index) => {
                    const orderData = order.order_details?.[0] || order;
                    const stallName = order.stall_name || orderData.stall_name || "N/A";

                    // Try to get net amount (without GST) - prioritize net amount fields
                    let netAmount = order.prepaid_after_deduction ||
                      orderData.prepaid_after_deduction ||
                      order.postpaid_net_amount ||
                      orderData.postpaid_net_amount ||
                      order.net_amount ||
                      orderData.net_amount ||
                      order.net_sales ||
                      orderData.net_sales ||
                      order.subtotal ||
                      orderData.subtotal ||
                      order.amount_without_gst ||
                      orderData.amount_without_gst;

                    // If still no net amount, calculate from gross - gst
                    if (!netAmount) {
                      const grossAmount = parseFloat(order.total_amount || orderData.total_amount || order.amount || orderData.amount || order.total || orderData.total || 0);
                      // Try to get total GST - check multiple fields
                      const totalGst = parseFloat(order.total_gst || 0);
                      const cgstSgst = parseFloat((order.cgst || 0) + (order.sgst || 0));
                      const gstAmount = totalGst > 0 ? totalGst : (cgstSgst > 0 ? cgstSgst : parseFloat(order.gst || orderData.gst || order.gst_amount || orderData.gst_amount || order.tax || orderData.tax || order.tax_amount || orderData.tax_amount || 0));
                      netAmount = grossAmount - gstAmount;
                    }

                    netAmount = parseFloat(netAmount) || 0;

                    return (
                      <div key={index} className="order-history-item">
                        <div className="date-column">
                          {stallName}
                        </div>
                        <div className="orders-column">
                          1
                        </div>
                        <div className="amount-column">
                          ₹{netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Total Row */}
                  <div className="order-history-item order-history-total">
                    <div className="date-column">
                      <strong>Total</strong>
                    </div>
                    <div className="orders-column">
                      <strong>{orderHistory.length}</strong>
                    </div>
                    <div className="amount-column">
                      <strong>₹{(() => {
                        // Use the pre-calculated sales summary total for the selected period
                        // This ensures consistency with the sales dashboard circles
                        let periodSalesNet = 0;
                        if (selectedPeriod === "daily") {
                          periodSalesNet = periodSales.today?.net || 0;
                        } else if (selectedPeriod === "weekly") {
                          periodSalesNet = periodSales.thisWeek?.net || 0;
                        } else if (selectedPeriod === "monthly") {
                          periodSalesNet = periodSales.thisMonth?.net || 0;
                        }
                        console.log(`Using sales-summary API total for ${selectedPeriod} (periodSales):`, periodSalesNet);
                        return periodSalesNet.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      })()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CONTROLS */}
        <div className="controls-bar">
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortOrder === "AZ" ? "active" : ""}`}
              onClick={() => setSortOrder("AZ")}
            >
              Sort A → Z
            </button>
            <button
              className={`sort-btn ${sortOrder === "ZA" ? "active" : ""}`}
              onClick={() => setSortOrder("ZA")}
            >
              Sort Z → A
            </button>
          </div>
          <button className="export-btn" onClick={exportExcel}>
            📥 Export Excel
          </button>
          <button className="refresh-btn" onClick={fetchSalesSummary} disabled={loading}>
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* TABLE SECTION */}
        {loading ? (
          <div className="loading-container">
            <div className="loader-spinner"></div>
            <p>Loading sales data...</p>
          </div>
        ) : sortedSales.length === 0 ? (
          <div className="empty-state">
            <p>No sales data available</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Outlet Name</th>
                  <th>Prepaid Net</th>
                  <th>Postpaid Net</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((stall, index) => (
                  <tr key={index} className="table-row">
                    <td className="outlet-name">{stall.stall_name}</td>
                    <td className="prepaid-cell">₹{stall.prepaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="postpaid-cell">₹{stall.postpaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="total-cell">₹{((stall.prepaid_net + stall.postpaid_net) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="outlet-name"><strong>Total</strong></td>
                  <td className="prepaid-cell"><strong>₹{totals.prepaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></td>
                  <td className="postpaid-cell"><strong>₹{totals.postpaid_net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></td>
                  <td className="total-cell"><strong>₹{((totals.prepaid_net + totals.postpaid_net) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}