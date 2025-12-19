import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useHrAuth } from "../../AuthContex/HrContext";
import "./OrderPage.css";

const OrdersModal = ({ groupId, onClose }) => {
  const { token } = useHrAuth();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Date filters
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔹 Payment filter (NEW)
  const [paymentFilter, setPaymentFilter] = useState("all"); // all | prepaid | postpaid

  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch orders
  const fetchOrders = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const start =
        startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const end = endDate || new Date().toISOString().split("T")[0];

      const url = `https://admin-aged-field-2794.fly.dev/wallet-group/${groupId}/orders/?start_date=${start}&end_date=${end}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
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

  // ✅ Apply date + payment filters
  useEffect(() => {
    if (!submitted) return;

    let filtered = [...orders];
    const now = new Date();

    // 🔹 Date filters
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
    }

    if (dateFilter === "week") {
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
    }

    if (dateFilter === "month") {
      const currentMonth = now.getMonth();
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime).getMonth() === currentMonth
      );
    }

    // 🔹 Payment filter (NEW)
    if (paymentFilter === "postpaid") {
      filtered = filtered.filter((o) => o.paid_with_wallet === true);
    }

    if (paymentFilter === "prepaid") {
      filtered = filtered.filter((o) => o.paid_with_wallet === false);
    }

    setFilteredOrders(filtered);
  }, [submitted, orders, dateFilter, paymentFilter]);

  // ✅ Amount calculation
  const calculateAmounts = (order) => {
    const itemTotal =
      order.order_details?.reduce((sum, i) => sum + i.total, 0) || 0;
    const totalGst = order.total_gst || 0;
    const grandTotal = Math.round(itemTotal + totalGst);
    return { grandTotal };
  };

  const totalPaid = filteredOrders.reduce(
    (sum, o) => sum + calculateAmounts(o).grandTotal,
    0
  );

  // ✅ Export to Excel (unchanged)
  const exportToExcel = () => {
    let totalAmountPaid = 0;

    const rows = filteredOrders.flatMap((o) => {
      const { grandTotal } = calculateAmounts(o);
      totalAmountPaid += grandTotal;

      return o.order_details.map((i) => ({
        Stall: o.stall_name || "N/A",
        Token: o.token_number || "N/A",
        Email: o.user_email || "",
        PaymentType: o.paid_with_wallet ? "Postpaid" : "Prepaid",
        Date: new Date(o.created_datetime).toLocaleString(),
        Item: i.name,
        Qty: i.quantity,
        AmountPaid: grandTotal.toFixed(2),
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "wallet_group_orders.xlsx");
  };

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

        {/* ✅ Filters */}
        <div className="filter-section">
          <label>
            Date Filter:
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </label>

          <label>
            Payment Type:
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
          </label>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {/* ✅ Table */}
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
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const { grandTotal } = calculateAmounts(order);
                  return (
                    <tr key={order.id}>
                      <td>{order.stall_name}</td>
                      <td>{order.token_number}</td>
                      <td>{order.user_email}</td>
                      <td>
                        {order.paid_with_wallet ? "Postpaid" : "Prepaid"}
                      </td>
                      <td>
                        {new Date(order.created_datetime).toLocaleString()}
                      </td>
                      <td>{grandTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="total-section">
              <h3>Total Paid: ₹{totalPaid.toFixed(2)}</h3>
              <button onClick={exportToExcel}>Export to Excel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersModal;
