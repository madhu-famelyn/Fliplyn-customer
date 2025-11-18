// src/pages/hr/OrdersModal.js
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useHrAuth } from "../../AuthContex/HrContext";
import "./OrderPage.css";

const OrdersModal = ({ groupId, onClose }) => {
  const { token } = useHrAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch orders (yyyy-mm-dd date format)
  const fetchOrders = async () => {
    if (!groupId) {
      console.warn("⚠️ No groupId provided");
      return;
    }
    setLoading(true);
    try {
      // Convert to yyyy-mm-dd strings
      let start =
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      let end = endDate || new Date().toISOString().split("T")[0];

      const url = `https://admin-aged-field-2794.fly.dev/wallet-group/${groupId}/orders/?start_date=${start}&end_date=${end}`;
      console.log("📡 Fetching:", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🔍 Response status:", res.status);
      const data = await res.json();
      console.log("📦 Orders:", data);

      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter logic for day/week/month
  useEffect(() => {
    if (!submitted || !orders.length) return;

    let filtered = [...orders];
    const now = new Date();

    if (dateFilter === "day") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      filtered = filtered.filter(
        (o) =>
          new Date(o.created_datetime) >= today &&
          new Date(o.created_datetime) < tomorrow
      );
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      filtered = filtered.filter(
        (o) =>
          new Date(o.created_datetime) >= startOfWeek &&
          new Date(o.created_datetime) < endOfWeek
      );
    } else if (dateFilter === "month") {
      const currentMonth = now.getMonth();
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime).getMonth() === currentMonth
      );
    }

    setFilteredOrders(filtered);
  }, [submitted, orders, dateFilter, startDate, endDate]);

  // ✅ Calculate totals
  const calculateAmounts = (order) => {
    const itemTotal = order.order_details?.reduce((sum, i) => sum + i.total, 0);
    const totalGst = order.total_gst || 0;
    const grandTotal = Math.round(itemTotal + totalGst);
    return { grandTotal };
  };

  const totalPaid = filteredOrders.reduce(
    (sum, o) => sum + calculateAmounts(o).grandTotal,
    0
  );

  // ✅ Export to Excel
const exportToExcel = () => {
  let totalNetAmount = 0;
  let totalAmountPaid = 0;

  const rows = filteredOrders.flatMap((o) => {
    const { grandTotal } = calculateAmounts(o);
    totalAmountPaid += grandTotal;

    // Create item rows
    const itemRows = o.order_details.map((i, index) => {
      const netAmount = (i.price * i.quantity);
      totalNetAmount += netAmount;

      return {
        Stall: o.stall_name || "N/A",
        Token: o.token_number || "N/A",
        Email: o.user_email || "",
        Date: new Date(o.created_datetime).toLocaleString(),
        Item: i.name,
        Qty: i.quantity,
        NetAmount: netAmount.toFixed(2),
        AmountPaid: index === o.order_details.length - 1 ? grandTotal.toFixed(2) : ""
      };
    });

    return itemRows;
  });

  // Add summary rows at end
  rows.push(
    {
      Stall: "",
      Token: "",
      Email: "",
      Date: "",
      Item: "TOTAL NET AMOUNT",
      Qty: "",
      NetAmount: totalNetAmount.toFixed(2),
      AmountPaid: ""
    },
    {
      Stall: "",
      Token: "",
      Email: "",
      Date: "",
      Item: "TOTAL AMOUNT PAID",
      Qty: "",
      NetAmount: "",
      AmountPaid: totalAmountPaid.toFixed(2)
    }
  );

  const ws = XLSX.utils.json_to_sheet(rows);

  // 🔥 Make header row BOLD
  const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"];
  headerCells.forEach((cell) => {
    if (!ws[cell]) return;
    ws[cell].s = {
      font: { bold: true }
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, "wallet_group_orders.xlsx");
};

  // ✅ Submit handler
  const handleSubmit = async () => {
    setSubmitted(true);
    await fetchOrders();
  };

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h2>Wallet Group Order History</h2>

        {/* ✅ Filter Section */}
        <div className="filter-section">
          <label>
            Select Date Range:
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="day">This Day</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Dates</option>
            </select>
          </label>

          {dateFilter === "custom" && (
            <>
              <label>
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label>
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </>
          )}

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {/* ✅ Table Section */}
        {loading && <p>Loading orders...</p>}
        {!loading && submitted && filteredOrders.length === 0 && (
          <p>No orders found.</p>
        )}

        {!loading && submitted && filteredOrders.length > 0 && (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Stall</th>
                  <th>Token</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const { grandTotal } = calculateAmounts(order);
                  return (
                    <tr key={order.id}>
                      <td>{order.stall_name || "N/A"}</td>
                      <td>{order.token_number || "N/A"}</td>
                      <td>{order.user_email || "N/A"}</td>
                      <td>
                        {new Date(order.created_datetime).toLocaleString()}
                      </td>
                      <td>
                        <ul className="items-list">
                          {order.order_details?.map((item, idx) => (
                            <li key={idx}>
                              {item.name} × {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <strong>{grandTotal.toFixed(2)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ✅ Total & Export Section */}
            <div className="total-section">
              <h3>Total Paid: ₹{totalPaid.toFixed(2)}</h3>
              <button
                className="export-btn"
                onClick={exportToExcel}
                disabled={!filteredOrders.length}
              >
                Export to Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersModal;
