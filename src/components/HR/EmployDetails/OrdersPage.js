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
  const [timeFilter, setTimeFilter] = useState("");

  // Fetch stall name by stall_id
  const fetchStallName = async (stallId) => {
    try {
      const res = await fetch(`https://admin-aged-field-2794.fly.dev/stalls/${stallId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return "N/A";
      const data = await res.json();
      return Array.isArray(data) ? data[0]?.name || "N/A" : data?.name || "N/A";
    } catch {
      return "N/A";
    }
  };

  const fetchStallNameFromOrder = async (order) => {
    if (!order.order_details?.length) return "N/A";
    const firstItemId = order.order_details[0].item_id;
    try {
      const res = await fetch(`https://admin-aged-field-2794.fly.dev/items/items/${firstItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return "N/A";
      const itemData = await res.json();
      const stallId = itemData?.stall_id;
      return stallId ? await fetchStallName(stallId) : "N/A";
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userIds?.length) return;
      setLoading(true);
      try {
        const allOrders = await getOrdersByUserIds(userIds, token);

        const enrichedOrdersResults = await Promise.allSettled(
          allOrders.map(async (o) => {
            try {
              const stallName = await fetchStallNameFromOrder(o);
              return { ...o, stallName };
            } catch {
              return null;
            }
          })
        );

        const enrichedOrders = enrichedOrdersResults
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => r.value);

        setOrders(enrichedOrders);
        setFilteredOrders(enrichedOrders);
      } catch {
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userIds, token]);

  useEffect(() => {
    let filtered = orders;
    const now = new Date();

    if (timeFilter === "day") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) >= today && new Date(o.created_datetime) < tomorrow
      );
    }

    if (timeFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) >= startOfWeek && new Date(o.created_datetime) < endOfWeek
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) >= new Date(startDate + "T00:00:00")
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime) <= new Date(endDate + "T23:59:59")
      );
    }

    if (month) {
      filtered = filtered.filter(
        (o) => new Date(o.created_datetime).getMonth() + 1 === parseInt(month)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, startDate, endDate, month, timeFilter]);

  const calculateAmounts = (order) => {
    const itemTotal = order.order_details.reduce((sum, i) => sum + i.total, 0);
    const totalGst = order.total_gst || 0;
    const totalWithGst = itemTotal + totalGst;
    const roundedTotal = Math.round(totalWithGst);
    const roundOff = (roundedTotal - totalWithGst).toFixed(2);
    const grandTotal = roundedTotal;
    return { grandTotal };
  };

  const totalAmount = filteredOrders.reduce(
    (sum, o) => sum + calculateAmounts(o).grandTotal,
    0
  );

  const exportToExcel = () => {
    const rows = filteredOrders.flatMap((o) => {
      const { grandTotal } = calculateAmounts(o);
      return o.order_details.map((i) => ({
        Stall: o.stallName,
        Token: o.token_number,
        Email: o.user_email || "",
        Date: new Date(o.created_datetime).toLocaleString(),
        Item: i.name,
        Qty: i.quantity,
        Price: i.price.toFixed(2),
        GrandTotal: grandTotal.toFixed(2),
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx");
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
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quick Filter:
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="day">This Day</option>
              <option value="week">This Week</option>
            </select>
          </label>
          <button className="export-btn" onClick={exportToExcel}>Export to Excel</button>
        </div>

        {loading && <p>Loading orders...</p>}
        {!loading && filteredOrders.length === 0 && <p>No orders found.</p>}

        {!loading && filteredOrders.length > 0 && (
          <table className="orders-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Stall</th>
                <th>Token</th>
                <th>Email</th>
                <th>Date</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const { grandTotal } = calculateAmounts(o);
                return o.order_details.map((i, idx) => (
                  <tr key={`${o.id}-${i.item_id}-${idx}`} style={{ borderBottom: "1px solid #ddd" }}>
                    <td>{o.stallName}</td>
                    <td>{o.token_number}</td>
                    <td>{o.user_email || ""}</td>
                    <td>{new Date(o.created_datetime).toLocaleString()}</td>
                    <td>{i.name}</td>
                    <td>{i.quantity}</td>
                    <td>{grandTotal.toFixed(2)}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}

        <div className="total-section">
          <h3>Total Paid: ₹{totalAmount.toFixed(2)}</h3>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
