import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useHrAuth } from "../../AuthContex/HrContext";
import "./OrderPage.css";

const OrdersModal = ({ userIds, onClose }) => {
  const { token } = useHrAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState(""); // new month filter

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userIds || userIds.length === 0) return;

      setLoading(true);
      try {
        let allOrders = [];
        for (const userId of userIds) {
          const res = await axios.get(
            `https://admin-aged-field-2794.fly.dev/orders/user/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          allOrders = [...allOrders, ...res.data];
        }
        // sort latest first
        allOrders.sort(
          (a, b) => new Date(b.created_datetime) - new Date(a.created_datetime)
        );
        setOrders(allOrders);
        setFilteredOrders(allOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        alert("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userIds, token]);

  // 🔍 Filter when startDate, endDate, or month changes
  useEffect(() => {
    let filtered = orders;

    if (startDate) {
      filtered = filtered.filter(
        (order) =>
          new Date(order.created_datetime) >= new Date(startDate + "T00:00:00")
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (order) =>
          new Date(order.created_datetime) <= new Date(endDate + "T23:59:59")
      );
    }
    if (month) {
      filtered = filtered.filter(
        (order) => new Date(order.created_datetime).getMonth() + 1 === parseInt(month)
      );
    }

    setFilteredOrders(filtered);
  }, [startDate, endDate, month, orders]);

  // 📊 Total Amount
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // 📤 Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredOrders.map((order) => ({
        "Order #": order.token_number,
        User: `${order.user_email} (${order.user_phone})`,
        Date: new Date(order.created_datetime).toLocaleString(),
        "Total Amount": order.total_amount,
        GST: order.total_gst,
        "Paid With Wallet": order.paid_with_wallet ? "Yes" : "No",
        Items: order.order_details
          .map((item) => `${item.name} - ${item.quantity} × ₹${item.price}`)
          .join(", "),
      }))
    );

    // ➕ Add total row at the end
    const lastRow = filteredOrders.length + 2;
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["", "", "TOTAL", totalAmount]],
      { origin: `A${lastRow}` }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h2>Order History</h2>

        {/* 🔽 Date filters + Month filter + Export */}
        <div className="filter-section">
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
          <label>
            Month:
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </label>
          <button onClick={exportToExcel} className="export-btn">
            Export to Excel
          </button>
        </div>

        {loading && <p>Loading orders...</p>}
        {!loading && filteredOrders.length === 0 && <p>No orders found.</p>}

        {!loading && filteredOrders.length > 0 && (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>GST</th>
                  <th>Paid With Wallet</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.token_number}</td>
                    <td>
                      {order.user_email} ({order.user_phone})
                    </td>
                    <td>{new Date(order.created_datetime).toLocaleString()}</td>
                    <td>₹{order.total_amount.toFixed(2)}</td>
                    <td>₹{order.total_gst.toFixed(2)}</td>
                    <td>{order.paid_with_wallet ? "Yes" : "No"}</td>
                    <td>
                      <ul className="items-list">
                        {order.order_details.map((item) => (
                          <li key={item.item_id}>
                            {item.name} - {item.quantity} × ₹{item.price} = ₹
                            {item.total}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🔽 Total amount at bottom */}
            <div className="total-section">
              <h3>Total Amount: ₹{totalAmount.toFixed(2)}</h3>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersModal;
