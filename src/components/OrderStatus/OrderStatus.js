import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OrderStatus.css";

const API_BASE = "https://admin-aged-field-2794.fly.dev";

export default function OrderStatus() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");

  const [stallIds, setStallIds] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedStall, setSelectedStall] = useState("");

  // ✅ Load vendor stall_ids from localStorage
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("stallIds")) || [];
    setStallIds(ids);
    if (ids.length > 0) {
      setSelectedStall(ids[0]);
    }
  }, []);

  // ✅ Fetch stall names
  useEffect(() => {
    async function loadStalls() {
      try {
        const requests = stallIds.map((id) =>
          axios.get(`${API_BASE}/stalls/${id}`)
        );
        const results = await Promise.all(requests);
        setStalls(results.map((res) => res.data));
      } catch (error) {
        console.error("Error fetching stalls:", error.response?.data || error.message);
      }
    }

    if (stallIds.length) {
      loadStalls();
    }
  }, [stallIds]);

  // ✅ Fetch orders when filters change
  useEffect(() => {
    if (activeTab === "ongoing") {
      fetchOrders();
    }

    const interval = setInterval(() => {
      if (activeTab === "ongoing") {
        fetchOrders();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [activeTab, timeFilter, selectedStall]);

  // ✅ Load stored data when switching tabs
  useEffect(() => {
    loadFromLocalStorage();
  }, [activeTab]);

  // ✅ Search filter
  useEffect(() => {
    handleSearch();
  }, [searchTerm, orders]);

  // ✅ Fetch Orders (Axios)
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders/status-time`, {
        params: {
          status: "PENDING",
          minutes: timeFilter,
          stall_id: selectedStall
        }
      });

      setOrders(res.data);
      setFilteredOrders(res.data);
      localStorage.setItem("pending_orders", JSON.stringify(res.data));
    } catch (error) {
      console.error("Error fetching orders:", error.response?.data || error.message);
    }
  };

  // ✅ Load localStorage data
  const loadFromLocalStorage = () => {
    const key =
      activeTab === "ongoing" ? "pending_orders" : "completed_orders";

    const stored = JSON.parse(localStorage.getItem(key)) || [];
    setOrders(stored);
    setFilteredOrders(stored);
  };

  // ✅ Search Logic
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const lower = searchTerm.toLowerCase();

    const filtered = orders.filter((order) => {
      const hasToken = order.token_number?.toLowerCase().includes(lower);
      const hasOrderId = order.order_id?.toLowerCase().includes(lower);
      const hasItem = order.items?.some((item) =>
        item.name?.toLowerCase().includes(lower)
      );

      return hasToken || hasOrderId || hasItem;
    });

    setFilteredOrders(filtered);
  };

  // ✅ Complete Order (Axios)
  const completeOrder = async (order) => {
    try {
      await axios.put(`${API_BASE}/orders/complete/${order.order_id}`);

      const updatedPending = orders.filter(
        (o) => o.order_id !== order.order_id
      );

      localStorage.setItem("pending_orders", JSON.stringify(updatedPending));

      const completed =
        JSON.parse(localStorage.getItem("completed_orders")) || [];

      const updatedCompleted = [...completed, order];

      localStorage.setItem(
        "completed_orders",
        JSON.stringify(updatedCompleted)
      );

      setOrders(updatedPending);
      setFilteredOrders(updatedPending);
    } catch (error) {
      console.error("Complete order failed:", error.response?.data || error.message);
    }
  };

  return (
    <div className="order-container">
      <h2 className="title">Order List</h2>

      <div className="filters">
        {/* ✅ Search Input */}
        <input
          className="search-input"
          type="text"
          placeholder="Search items, order ID, token no"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* ✅ Stall Dropdown */}
        <select
          className="stall-dropdown"
          value={selectedStall}
          onChange={(e) => setSelectedStall(e.target.value)}
        >
          {stalls.map((stall) => (
            <option key={stall.id} value={stall.id}>
              {stall.name}
            </option>
          ))}
        </select>

        {/* ✅ Time Filter */}
        {activeTab === "ongoing" && (
          <select
            className="time-dropdown"
            value={timeFilter}
            onChange={(e) => setTimeFilter(Number(e.target.value))}
          >
            <option value={10}>Last 10 mins</option>
            <option value={15}>Last 15 mins</option>
            <option value={20}>Last 20 mins</option>
            <option value={30}>Last 30 mins</option>
          </select>
        )}

        <button
          className={activeTab === "ongoing" ? "btn active-tab" : "btn"}
          onClick={() => setActiveTab("ongoing")}
        >
          On Going
        </button>

        <button
          className={activeTab === "completed" ? "btn active-tab" : "btn"}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      <table className="order-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Items</th>
            <th>Created</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <tr key={index}>
                <td>
                  <p className="order-id">{order.token_number}</p>
                  <p className="item-sub">
                    {order.items.map((i) => i.name).join(", ")}
                  </p>
                </td>

                <td>
                  {order.items.map((item, i) => (
                    <p key={i}>
                      {item.name} x {item.quantity}
                    </p>
                  ))}
                </td>

                <td>
                  {new Date(order.created_datetime).toLocaleString()}
                </td>

                <td>
                  {activeTab === "ongoing" ? (
                    <button
                      className="complete-btn"
                      onClick={() => completeOrder(order)}
                    >
                      Complete Order
                    </button>
                  ) : (
                    <span className="completed-text">✅ Completed</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <footer className="pagination">
        <span>Rows per page: 10</span>
        <span>
          1 - {filteredOrders.length} of {filteredOrders.length}
        </span>
      </footer>
    </div>
  );
}
