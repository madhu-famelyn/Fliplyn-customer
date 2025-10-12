import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import * as XLSX from "xlsx";
import "./StallsReport.css";

export default function StallSalesReport() {
  const { user } = useAuth();
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stall");
  const [submitted, setSubmitted] = useState(false);

  // ✅ Fetch stalls initially
  useEffect(() => {
    const fetchStalls = async () => {
      if (!user?.building_id) return;
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${user.building_id}`
        );
        setStalls(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch stalls.");
      }
    };
    fetchStalls();
  }, [user]);

  // ✅ Fetch orders after submission
  useEffect(() => {
    if (!user?.building_id || !submitted) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        let fetchedOrders = [];

const fetchOrdersByStall = async (stall) => {
  const baseUrl = "https://admin-aged-field-2794.fly.dev/orders";
  let res;

  try {
    if (filter === "custom") {
      if (!customRange.start || !customRange.end) return [];
      res = await axios.get(`${baseUrl}/by-stall/${stall.id}/range`, {
        params: {
          start_date: customRange.start,
          end_date: customRange.end,
        },
      });
    } else {
      const now = new Date();
      let startDate, endDate;

      if (filter === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split("T")[0];
        endDate = new Date().toISOString().split("T")[0];
      } else if (filter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().split("T")[0];
        endDate = new Date().toISOString().split("T")[0];
      } else if (filter === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = startOfMonth.toISOString().split("T")[0];
        endDate = new Date().toISOString().split("T")[0];
      } else {
        return [];
      }

      res = await axios.get(`${baseUrl}/by-stall/${stall.id}/range`, {
        params: { start_date: startDate, end_date: endDate },
      });
    }

    return res.data.map((order) => ({ ...order, stall_name: stall.name }));
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`No orders found for stall ${stall.name} in this range.`);
      return []; // **return empty array on 404**
    }
    throw err; // re-throw other errors
  }
};


        if (selectedStallId === "all") {
          for (let stall of stalls) {
            try {
              const stallOrders = await fetchOrdersByStall(stall);
              fetchedOrders.push(...stallOrders);
            } catch {
              console.warn(`No orders for stall ${stall.name}`);
            }
          }
        } else {
          const selectedStall = stalls.find((s) => s.id === selectedStallId);
          if (selectedStall) {
            const stallOrders = await fetchOrdersByStall(selectedStall);
            fetchedOrders.push(...stallOrders);
          }
        }

        setOrders(fetchedOrders);
        localStorage.setItem("stallOrders", JSON.stringify(fetchedOrders));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
        setOrders([]);
      } finally {
        setLoading(false);
        setSubmitted(false);
      }
    };

    fetchOrders();
  }, [selectedStallId, stalls, user, submitted, filter, customRange]);

  // ✅ Extract company name from email
  const getCompanyName = (email) => {
    if (!email) return "Unknown";
    const domain = email.split("@")[1] || "";
    return domain.includes("cashe") ? "cashe" : "Other";
  };

  // ✅ Company filter
  const companyFilteredOrders =
    companyFilter === "all"
      ? orders
      : orders.filter(
          (order) => getCompanyName(order.user_email) === companyFilter
        );

  // ✅ Sorting
  const sortedOrders = [...companyFilteredOrders].sort((a, b) =>
    sortBy === "date"
      ? new Date(a.created_datetime) - new Date(b.created_datetime)
      : a.stall_name.localeCompare(b.stall_name)
  );

  // ✅ Grand total
  const totalSales = sortedOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  // ✅ Unique companies (only “cashe”)
  const companies = Array.from(
    new Set(
      orders
        .map((o) => getCompanyName(o.user_email))
        .filter((c) => c === "cashe")
    )
  );

  // ✅ Export to Excel
  const exportToExcel = () => {
    const rows = sortedOrders.flatMap((order) =>
      order.order_details.map((item, index) => ({
        Stall: order.stall_name,
        Token: order.token_number,
        Email: order.user_email,
        Date: new Date(order.created_datetime).toLocaleString(),
        Item: item.name,
        Quantity: item.quantity,
        Price: item.price,
        Total: item.total,
        GST_Total: order.total_gst,
        Round_Off: index === 0 ? order.round_off : "",
        Total_Paid:
          index === 0
            ? order.order_details.reduce((sum, d) => sum + d.total, 0) +
              (order.round_off || 0)
            : "",
      }))
    );

    rows.push({
      Total_Paid: "Grand Total: ₹" + totalSales.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stall Sales Report");
    XLSX.writeFile(wb, "Stall_Sales_Report.xlsx");
  };

  // ✅ Handle Submit
  const handleSubmit = () => {
    if (!filter) {
      alert("Please select a date filter (Today, Week, Month, or Custom)");
      return;
    }
    if (filter === "custom" && (!customRange.start || !customRange.end)) {
      alert("Please select both start and end dates for custom range.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="stall-report-container-unique">
      <h2 className="stall-report-title-unique">Stall Sales Report</h2>

      {/* Filters */}
      <div className="stall-report-filters-row-unique">
        <div className="stall-report-dropdown-unique">
          <label htmlFor="stall-select">Select Stall:</label>
          <select
            id="stall-select"
            value={selectedStallId}
            onChange={(e) => setSelectedStallId(e.target.value)}
          >
            <option value="all">All Stalls</option>
            {stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.name}
              </option>
            ))}
          </select>
        </div>

        <div className="stall-report-sort-unique">
          <label htmlFor="sort-select">Sort By:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="stall">Stall</option>
            <option value="date">Date</option>
          </select>
        </div>

        <div className="stall-report-company-filter-unique">
          <label htmlFor="company-select">Filter by Company:</label>
          <select
            id="company-select"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filter Buttons */}
      <div className="stall-report-date-filters-unique">
        <button onClick={() => setFilter("today")}>Today</button>
        <button onClick={() => setFilter("week")}>This Week</button>
        <button onClick={() => setFilter("month")}>This Month</button>
        <button onClick={() => setFilter("custom")}>Custom</button>

        {filter === "custom" && (
          <div className="stall-report-custom-range-unique">
            <input
              type="date"
              value={customRange.start}
              onChange={(e) =>
                setCustomRange({ ...customRange, start: e.target.value })
              }
            />
            <input
              type="date"
              value={customRange.end}
              onChange={(e) =>
                setCustomRange({ ...customRange, end: e.target.value })
              }
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="stall-report-submit-btn-container-unique">
        <button
          className="stall-report-submit-btn-unique"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

      {/* Export */}
      {orders.length > 0 && (
        <div className="stall-report-export-btn-unique">
          <button onClick={exportToExcel}>Export to Excel</button>
        </div>
      )}

      {/* Loading/Error */}
      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && sortedOrders.length === 0 && submitted && (
        <div className="stall-report-no-orders-unique">
          <p>No orders found for this date range.</p>
        </div>
      )}

      {/* Orders Table */}
      {sortedOrders.length > 0 && (
        <>
          <h3 className="stall-report-total-unique">
            Grand Total Sales: ₹{totalSales.toFixed(2)}
          </h3>
          <table className="stall-report-table-unique">
            <thead>
              <tr>
                <th>Stall</th>
                <th>Token</th>
                <th>User Email</th>
                <th>Date</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>GST</th>
                <th>Round Off</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) =>
                order.order_details.map((item, index) => {
                  const totalPaid =
                    order.order_details.reduce((sum, d) => sum + d.total, 0) +
                    (order.round_off || 0);
                  return (
                    <tr key={`${order.id}-${item.item_id}`}>
                      <td>{order.stall_name}</td>
                      <td>{order.token_number}</td>
                      <td>{order.user_email}</td>
                      <td>
                        {new Date(order.created_datetime).toLocaleString()}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{item.total}</td>
                      <td>₹{order.total_gst}</td>
                      <td>{index === 0 ? `₹${order.round_off}` : ""}</td>
                      <td>{index === 0 ? `₹${totalPaid.toFixed(2)}` : ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
