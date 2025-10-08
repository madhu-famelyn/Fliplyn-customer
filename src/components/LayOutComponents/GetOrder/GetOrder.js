import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function OrdersByEmail() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "created_datetime", direction: "desc" });

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `https://fliplyn.onrender.com/orders/user/by-email/${encodeURIComponent(email)}`
      );
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to fetch orders");
      setOrders([]);
    }
    setLoading(false);
  };

  // GST calculation per item
  const calculateGSTPerItem = (item) => {
    const itemTotal = item.price * item.quantity;
    const gstAmount = parseFloat((itemTotal * 0.05).toFixed(2));
    const halfGst = parseFloat((gstAmount / 2).toFixed(2));
    const totalWithGST = parseFloat((itemTotal + gstAmount).toFixed(2));
    return { itemTotal, cgst: halfGst, sgst: halfGst, totalWithGST };
  };

  const exportToExcel = () => {
    if (orders.length === 0) return;

    const flattenedData = [];
    orders.forEach((order) => {
      order.order_details.forEach((item) => {
        const { itemTotal, cgst, sgst, totalWithGST } = calculateGSTPerItem(item);
        flattenedData.push({
          "Order ID": order.id,
          "Email": order.user_email,
          "Phone": order.user_phone,
          "Token Number": order.token_number,
          "Created At": order.created_datetime,
          "Item Name": item.name,
          "Qty": item.quantity,
          "Price": item.price,
          "Item Total": itemTotal,
          "CGST": cgst,
          "SGST": sgst,
          "Total with GST": totalWithGST,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(data);
    link.download = "orders_with_gst.xlsx";
    link.click();
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const key = sortConfig.key;
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    if (key === "total_amount" || key === "token_number") {
      return (a[key] - b[key]) * dir;
    }
    return (new Date(a[key]) - new Date(b[key])) * dir;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Fetch Orders by Email</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "8px", width: "250px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          onClick={fetchOrders}
          style={{ padding: "8px 15px", marginLeft: "10px", borderRadius: "4px", cursor: "pointer" }}
        >
          Fetch Orders
        </button>
        <button
          onClick={exportToExcel}
          style={{ padding: "8px 15px", marginLeft: "10px", borderRadius: "4px", cursor: "pointer" }}
        >
          Export to Excel
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {orders.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => requestSort("id")}>Order ID</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Token</th>
                <th style={styles.th}>Item Name</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Item Total</th>
                <th style={styles.th}>CGST</th>
                <th style={styles.th}>SGST</th>
                <th style={styles.th}>Total with GST</th>
                <th style={styles.th} onClick={() => requestSort("created_datetime")}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) =>
                order.order_details.map((item, idx) => {
                  const { itemTotal, cgst, sgst, totalWithGST } = calculateGSTPerItem(item);
                  return (
                    <tr key={`${order.id}-${idx}`} style={styles.tr}>
                      <td style={styles.td}>{order.id}</td>
                      <td style={styles.td}>{order.user_email}</td>
                      <td style={styles.td}>{order.user_phone}</td>
                      <td style={styles.td}>{order.token_number}</td>
                      <td style={styles.td}>{item.name}</td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>₹{item.price}</td>
                      <td style={styles.td}>₹{itemTotal}</td>
                      <td style={styles.td}>₹{cgst}</td>
                      <td style={styles.td}>₹{sgst}</td>
                      <td style={styles.td}>₹{totalWithGST}</td>
                      <td style={styles.td}>{new Date(order.created_datetime).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  th: {
    border: "1px solid #ddd",
    padding: "10px",
    backgroundColor: "#f7f7f7",
    cursor: "pointer",
    textAlign: "center",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "center",
    verticalAlign: "middle",
  },
  tr: {
    borderBottom: "1px solid #ddd",
  },
};
