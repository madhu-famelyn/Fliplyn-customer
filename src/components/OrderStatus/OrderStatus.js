import React, { useState, useEffect, useCallback } from "react";
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

  const [timer, setTimer] = useState(60);
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  // TRACK LAST FETCH TIMES
  const [lastPendingFetch, setLastPendingFetch] = useState(0);
  const [lastCompletedFetch, setLastCompletedFetch] = useState(0);

  // Load stall IDs
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("stallIds")) || [];
    setStallIds(ids);
    if (ids.length > 0) setSelectedStall(ids[0]);
  }, []);

  // Fetch stall names
  useEffect(() => {
    async function loadStalls() {
      try {
        const results = await Promise.all(
          stallIds.map((id) => axios.get(`${API_BASE}/stalls/${id}`))
        );
        setStalls(results.map((res) => res.data));
      } catch (err) {
        console.error("Error loading stalls:", err.message);
      }
    }
    if (stallIds.length > 0) loadStalls();
  }, [stallIds]);

  // MAIN FETCH FUNCTION
  const fetchOrders = useCallback(
    async (forceFetch = false) => {
      if (!selectedStall) return;

      const now = Date.now();
      const status = activeTab === "ongoing" ? "PENDING" : "COMPLETED";

      // STORAGE KEYS
      const storageKey =
        status === "PENDING"
          ? "pending_orders"
          : "completed_orders";

      const lastFetch =
        status === "PENDING"
          ? lastPendingFetch
          : lastCompletedFetch;

      // 1️⃣ **LOAD FROM LOCAL STORAGE WHEN ALLOWED**
      if (!forceFetch && status === "PENDING") {
        if (now - lastFetch < 60000) {
          const local = JSON.parse(localStorage.getItem("pending_orders")) || [];
          setOrders(local);
          setFilteredOrders(local);
          return;
        }
      }

      if (!forceFetch && status === "COMPLETED") {
        if (now - lastFetch < 60000) {
          const local = JSON.parse(localStorage.getItem("completed_orders")) || [];
          setOrders(local);
          setFilteredOrders(local);
          return;
        }
      }

      // 2️⃣ **CALL API IF REQUIRED**
      try {
        const res = await axios.get(`${API_BASE}/orders/status-time`, {
          params: {
            status,
            minutes: timeFilter,
            stall_id: selectedStall,
          },
        });

        setOrders(res.data);
        setFilteredOrders(res.data);

        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(res.data));

        // Update last fetch timestamp
        if (status === "PENDING") setLastPendingFetch(now);
        else setLastCompletedFetch(now);
      } catch (err) {
        console.error("Fetch error:", err.message);
      }
    },
    [activeTab, timeFilter, selectedStall, lastPendingFetch, lastCompletedFetch]
  );

  // TIMER FOR PENDING TAB
  useEffect(() => {
    if (activeTab !== "ongoing") return;

    setTimer(60);

    const countdown = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          fetchOrders(true);
          return 60;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [activeTab, fetchOrders]);

  // TAB OR FILTER CHANGE
  useEffect(() => {
    fetchOrders();
  }, [activeTab, timeFilter, selectedStall, fetchOrders]);

  // SEARCH FILTER
  useEffect(() => {
    if (!searchTerm.trim()) return setFilteredOrders(orders);

    const lower = searchTerm.toLowerCase();
    const filtered = orders.filter((order) => {
      return (
        order.token_number?.toLowerCase().includes(lower) ||
        order.order_id?.toLowerCase().includes(lower) ||
        order.items?.some((i) => i.name.toLowerCase().includes(lower))
      );
    });
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  // COMPLETE ORDER
  const completeOrder = async (order) => {
    setLoadingOrderId(order.order_id);

    try {
      await axios.put(`${API_BASE}/orders/complete/${order.order_id}`);

      const updated = orders.filter((o) => o.order_id !== order.order_id);

      localStorage.setItem("pending_orders", JSON.stringify(updated));
      setOrders(updated);
      setFilteredOrders(updated);
    } catch (err) {
      console.error("Complete error:", err.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="order-container">
      <div className="header-row">
        <h2 className="title">Order List</h2>

        {activeTab === "ongoing" && (
          <div className="refresh-timer">
            Refreshing in: <strong>{timer}s</strong>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search by item, order ID, token..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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

      {/* Table */}
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

                <td>{new Date(order.created_datetime).toLocaleString()}</td>

                <td>
                  {activeTab === "ongoing" ? (
                    <button
                      className="complete-btn"
                      onClick={() => completeOrder(order)}
                      disabled={loadingOrderId === order.order_id}
                    >
                      {loadingOrderId === order.order_id ? (
                        <span className="spinner"></span>
                      ) : (
                        "Complete Order"
                      )}
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
