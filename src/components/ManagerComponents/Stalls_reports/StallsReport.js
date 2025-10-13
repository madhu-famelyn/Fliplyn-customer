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

  // Fetch stalls
  useEffect(() => {
    if (!user?.building_id) return;

    const fetchStalls = async () => {
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

  // Helper: Convert local IST date to YYYY-MM-DD
// const getISTDateString = (date = new Date()) => {
//   // Convert to IST
//   const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  
//   // Format as YYYY-MM-DD
//   const year = istDate.getFullYear();
//   const month = String(istDate.getMonth() + 1).padStart(2, "0");
//   const day = String(istDate.getDate()).padStart(2, "0");
  
//   return `${year}-${month}-${day}`;
// };


  // Fetch orders based on selected filter
  useEffect(() => {
    if (!user?.building_id || !submitted) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        let fetchedOrders = [];

const fetchOrdersByStall = async (stall) => {
  const baseUrl = "https://admin-aged-field-2794.fly.dev/orders";
  let startDate, endDate;

  const now = new Date();

  // Helper to get IST start and end of a day
  const getUTCStartEndForISTDay = (date) => {
    const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const istStart = new Date(istDate);
    istStart.setHours(0, 0, 0, 0); // 00:00:00 IST
    const istEnd = new Date(istStart);
    istEnd.setDate(istEnd.getDate() + 1); // Start of next day
    return {
      start: istStart.toISOString(),
      end: istEnd.toISOString(),
    };
  };

  if (filter === "today") {
    const { start, end } = getUTCStartEndForISTDay(now);
    startDate = start;
    endDate = end;
  } else if (filter === "week") {
    // Start of week (Sunday) in IST
    const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const startOfWeek = new Date(istNow);
    startOfWeek.setDate(istNow.getDate() - istNow.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(istNow);
    endOfWeek.setHours(23, 59, 59, 999);

    startDate = startOfWeek.toISOString();
    endDate = endOfWeek.toISOString();
  } else if (filter === "month") {
    const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const startOfMonth = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(istNow);
    endOfMonth.setHours(23, 59, 59, 999);

    startDate = startOfMonth.toISOString();
    endDate = endOfMonth.toISOString();
  } else if (filter === "custom") {
    if (!customRange.start || !customRange.end) return [];
    const start = new Date(customRange.start + "T00:00:00");
    const end = new Date(customRange.end + "T23:59:59");
    startDate = start.toISOString();
    endDate = end.toISOString();
  } else {
    return [];
  }

  try {
    const res = await axios.get(`${baseUrl}/by-stall/${stall.id}/range`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return res.data.map((order) => ({ ...order, stall_name: stall.name }));
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};


        if (selectedStallId === "all") {
          for (let stall of stalls) {
            const stallOrders = await fetchOrdersByStall(stall);
            fetchedOrders.push(...stallOrders);
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
  }, [user, stalls, submitted, filter, customRange, selectedStallId]);

  // Company filter
  const getCompanyName = (email) => {
    if (!email) return "Unknown";
    const domain = email.split("@")[1] || "";
    return domain.includes("cashe") ? "cashe" : "Other";
  };

  const companyFilteredOrders =
    companyFilter === "all"
      ? orders
      : orders.filter(
          (order) => getCompanyName(order.user_email) === companyFilter
        );

  const sortedOrders = [...companyFilteredOrders].sort((a, b) =>
    sortBy === "date"
      ? new Date(a.created_datetime) - new Date(b.created_datetime)
      : a.stall_name.localeCompare(b.stall_name)
  );

  const totalSales = sortedOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  const companies = Array.from(
    new Set(
      orders
        .map((o) => getCompanyName(o.user_email))
        .filter((c) => c === "cashe")
    )
  );

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

      <div className="stall-report-dropdown-unique">
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

      <div className="stall-report-dropdown-unique">
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

<div className="stall-report-date-filter-row">
  <label htmlFor="date-filter-select" className="stall-report-date-label">
    Select Date Filter:
  </label>

  <select
    id="date-filter-select"
    className="stall-report-date-dropdown"
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
  >
    <option value="">Select Date Filter</option>
    <option value="today">Today</option>
    <option value="week">This Week</option>
    <option value="month">This Month</option>
    <option value="custom">Custom</option>
  </select>

  {filter === "custom" && (
    <div className="stall-report-custom-date-inputs">
      <input
        type="date"
        className="stall-report-date-dropdown"
        value={customRange.start}
        onChange={(e) =>
          setCustomRange({ ...customRange, start: e.target.value })
        }
      />
      <input
        type="date"
        className="stall-report-date-dropdown"
        value={customRange.end}
        onChange={(e) =>
          setCustomRange({ ...customRange, end: e.target.value })
        }
      />
    </div>
  )}
</div>


    <div className="stall-report-submit-btn-container-unique">
      <button
        className="stall-report-submit-btn-unique"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>

    {loading && <p>Loading orders...</p>}
    {error && <p style={{ color: "red" }}>{error}</p>}

    {!loading && !error && sortedOrders.length === 0 && submitted && (
      <div className="stall-report-no-orders-unique">
        <p>No orders found for this date range.</p>
      </div>
    )}

    {sortedOrders.length > 0 && (
      <>
        <h3 className="stall-report-total-unique">
          Grand Total Sales: ₹{totalSales.toFixed(2)}
        </h3>
        <div className="stall-report-export-btn-unique">
          <button onClick={exportToExcel}>Export to Excel</button>
        </div>
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
                      {new Date(order.created_datetime).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
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

