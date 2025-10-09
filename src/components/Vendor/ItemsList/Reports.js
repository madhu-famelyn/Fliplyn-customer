import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Reports.css";

const ReportsPage = () => {
  const { stallId } = useParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [stallName, setStallName] = useState("");

  // ✅ Fetch stall orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`https://admin-aged-field-2794.fly.dev/orders/by-stall/${stallId}`);
        setOrders(res.data);
        if (res.data.length > 0) {
          setStallName(res.data[0].order_details[0].stall_name);
        }
      } catch (err) {
        console.error("❌ Error fetching reports:", err.message);
      }
    };
    fetchOrders();
  }, [stallId]);

  // ✅ Filter orders by date
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_datetime);
    const today = new Date();

    if (filter === "today") {
      return orderDate.toDateString() === today.toDateString();
    }
    if (filter === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return orderDate >= startOfWeek && orderDate <= today;
    }
    if (filter === "month") {
      return (
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    }
    if (filter === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      return orderDate >= start && orderDate <= end;
    }
    return true;
  });

  // ✅ Calculate total
  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );

  return (
    <div className="reports-container">
      <h1>Reports for Stall: {stallName || "Loading..."}</h1>

      {/* Filter Controls */}
      <div className="filter-controls">
        <label>Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom</option>
        </select>

        {filter === "custom" && (
          <span className="date-range">
            From:{" "}
            <input
              type="date"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
            />
            To:{" "}
            <input
              type="date"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
            />
          </span>
        )}
      </div>

      {/* Orders Table */}
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Token No</th>
              <th>Payment Method</th>
              <th>Item Name(s)</th>
              <th>Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const date = new Date(order.created_datetime);
              return (
                <tr key={order.id}>
                  <td>{date.toLocaleDateString()}</td>
                  <td>{date.toLocaleTimeString()}</td>
                  <td>{order.token_number}</td>
                  <td>PostPaid</td>
                  <td>
                    {order.order_details.map((item) => (
                      <div key={item.item_id}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    {order.order_details.map((item) => (
                      <div key={item.item_id}>₹{item.price}</div>
                    ))}
                  </td>
                  <td>₹{order.total_amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <h2 className="total-amount">Total Amount: ₹{totalAmount}</h2>
    </div>
  );
};

export default ReportsPage;
