import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useHrAuth } from "../../AuthContex/HrContext";
import { getOrdersByUserIds } from "../../Service";
import "./OrderPage.css";

const OrdersModal = ({ userIds, onClose }) => {
  const { token } = useHrAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");

  // 🔄 Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userIds?.length) return;
      setLoading(true);
      const allOrders = await getOrdersByUserIds(userIds, token);
      setOrders(allOrders);
      setFilteredOrders(allOrders);
      setLoading(false);
    };
    fetchOrders();
  }, [userIds, token]);

  // 🔍 Filter orders by startDate, endDate, or month
  useEffect(() => {
    let filtered = orders;

    if (startDate)
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) >= new Date(startDate + "T00:00:00")
      );

    if (endDate)
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) <= new Date(endDate + "T23:59:59")
      );

    if (month)
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime).getMonth() + 1 === parseInt(month)
      );

    setFilteredOrders(filtered);
  }, [startDate, endDate, month, orders]);

  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // 📤 Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredOrders.map((o) => ({
        "Order #": o.token_number,
        User: `${o.user_email} (${o.user_phone})`,
        Date: new Date(o.created_datetime).toLocaleString(),
        "Total Amount": o.total_amount,
        GST: o.total_gst,
        "Paid With Wallet": o.paid_with_wallet ? "Yes" : "No",
        Items: o.order_details
          .map((i) => `${i.name} - ${i.quantity} × ₹${i.price}`)
          .join(", "),
      }))
    );

    XLSX.utils.sheet_add_aoa(worksheet, [["", "", "TOTAL", totalAmount]], {
      origin: `A${filteredOrders.length + 2}`,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal">
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>Order History</h2>

        <div className="filter-section">
          <label>
            Start Date:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            End Date:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <label>
            Month:
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>
              ))}
            </select>
          </label>
          <button className="export-btn" onClick={exportToExcel}>Export to Excel</button>
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
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.token_number}</td>
                    <td>{o.user_email} ({o.user_phone})</td>
                    <td>{new Date(o.created_datetime).toLocaleString()}</td>
                    <td>₹{o.total_amount.toFixed(2)}</td>
                    <td>₹{o.total_gst.toFixed(2)}</td>
                    <td>{o.paid_with_wallet ? "Yes" : "No"}</td>
                    <td>
                      <ul className="items-list">
                        {o.order_details.map((i) => (
                          <li key={i.item_id}>
                            {i.name} - {i.quantity} × ₹{i.price} = ₹{i.total}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
