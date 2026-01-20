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
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch orders
  const fetchOrders = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const start = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

      const end = new Date().toISOString().split("T")[0];

      const url = `https://admin-aged-field-2794.fly.dev/wallet-group/${groupId}/orders/?start_date=${start}&end_date=${end}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders", err);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filters
  useEffect(() => {
    if (!submitted) return;

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

    if (paymentFilter === "postpaid") {
      filtered = filtered.filter((o) => o.paid_with_wallet);
    }

    if (paymentFilter === "prepaid") {
      filtered = filtered.filter((o) => !o.paid_with_wallet);
    }

    setFilteredOrders(filtered);
  }, [submitted, orders, dateFilter, paymentFilter]);

  // ✅ Amount calculation
  const calculateAmounts = (order) => {
    const itemTotal =
      order.order_details?.reduce((sum, i) => sum + i.total, 0) || 0;
    const totalGst = order.total_gst || 0;
    return Math.round(itemTotal + totalGst);
  };

  const totalPaid = filteredOrders.reduce(
    (sum, o) => sum + calculateAmounts(o),
    0
  );

  // ✅ Export to Excel (item-wise, total once)
  const exportToExcel = () => {
    const rows = [];

    filteredOrders.forEach((o) => {
      const grandTotal = calculateAmounts(o);

      o.order_details.forEach((item, index) => {
        rows.push({
          Stall: o.stall_name || "N/A",
          Email: o.user_email || "",
          Token: o.token_number || "N/A",
          PaymentType: o.paid_with_wallet ? "Postpaid" : "Prepaid",
          Date: new Date(o.created_datetime).toLocaleString(),
          Item: item.name,
          Qty: item.quantity,
          AmountPaid:
            index === o.order_details.length - 1
              ? grandTotal.toFixed(2)
              : "",
        });
      });
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
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2>Wallet Group Order History</h2>

        {/* Filters */}
        <div className="filter-section">
          <label>
            Date Filter:
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="">All</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </label>

          <label>
            Payment Type:
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
          </label>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {loading && <p>Loading orders...</p>}

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
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const grandTotal = calculateAmounts(order);

                  return order.order_details.map((item, index) => (
                    <tr key={`${order.id}-${index}`}>
                      <td>{order.stall_name}</td>
                      <td>{order.token_number}</td>
                      <td>{order.user_email}</td>
                      <td>{order.paid_with_wallet ? "Postpaid" : "Prepaid"}</td>
                      <td>{new Date(order.created_datetime).toLocaleString()}</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {index === order.order_details.length - 1
                          ? grandTotal.toFixed(2)
                          : ""}
                      </td>
                    </tr>
                  ));
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
