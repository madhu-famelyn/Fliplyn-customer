import React, { useEffect, useState } from "react";
import axios from "axios";
import { useBuildingManagerAuth } from "../AuthContex/BuildingManagerContext";
import * as XLSX from "xlsx"; // ✅ For export
import { Outlet } from "react-router-dom";

export default function BuildingSalesReport() {
const { manager } = useBuildingManagerAuth();
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stall"); // ✅ new state

  // ✅ Fetch stalls
  useEffect(() => {
    const fetchStalls = async () => {
      if (!manager?.building_id) return;
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/stalls/building/${manager.building_id}`
        );
        setStalls(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch stalls.");
      }
    };
    fetchStalls();
  }, [manager]);

  // ✅ Fetch orders for stalls
  useEffect(() => {
    if (!manager?.building_id) return;
    setLoading(true);
    setError("");
    const fetchOrders = async () => {
      try {
        let fetchedOrders = [];

        if (selectedStallId === "all") {
          for (let stall of stalls) {
            try {
              const res = await axios.get(
                `https://admin-aged-field-2794.fly.dev/orders/by-stall/${stall.id}`
              );
              const stallOrders = res.data.map((order) => ({
                ...order,
                stall_name: stall.name,
              }));
              fetchedOrders.push(...stallOrders);
            } catch (err) {
              console.error(
                `Failed to fetch orders for stall ${stall.name}`,
                err
              );
            }
          }
        } else {
          const res = await axios.get(
            `https://admin-aged-field-2794.fly.dev/orders/by-stall/${selectedStallId}`
          );
          const stallName =
            stalls.find((s) => s.id === selectedStallId)?.name || "";
          fetchedOrders = res.data.map((order) => ({
            ...order,
            stall_name: stallName,
          }));
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [selectedStallId, stalls, manager]);

  // ✅ Filtering by date
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    const orderDate = new Date(order.created_datetime || new Date());
    const now = new Date();

    switch (filter) {
      case "today":
        return orderDate.toDateString() === now.toDateString();
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      case "month":
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      case "custom":
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      default:
        return true;
    }
  });

  // ✅ Extract company name (only cashe allowed)
  const getCompanyName = (email) => {
    if (!email) return "Unknown";
    const domain = email.split("@")[1] || "";
    if (domain.includes("cashe")) return "cashe";
    return "Other";
  };

  // ✅ Apply company filter
  let companyFilteredOrders =
    companyFilter === "all"
      ? filteredOrders
      : filteredOrders.filter(
          (order) => getCompanyName(order.user_email) === companyFilter
        );

  // ✅ Apply sorting
  companyFilteredOrders = [...companyFilteredOrders].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.created_datetime) - new Date(b.created_datetime);
    } else {
      return a.stall_name.localeCompare(b.stall_name);
    }
  });

  // ✅ Grand total sales = sum of Total Paid column
  const totalSales = companyFilteredOrders.reduce((acc, order) => {
    const totalPaid =
      order.order_details.reduce((sum, d) => sum + d.total, 0) +
      (order.round_off || 0);
    return acc + totalPaid;
  }, 0);

  // ✅ Get unique companies (only cashe)
  const companies = Array.from(
    new Set(
      filteredOrders
        .map((o) => getCompanyName(o.user_email))
        .filter((c) => c === "cashe")
    )
  );

  // ✅ Export to Excel with Grand Total row
  const exportToExcel = () => {
    const rows = companyFilteredOrders.flatMap((order) =>
      order.order_details.map((item, index) => ({
        Outlet: order.stall_name,
        Token: order.token_number,
        Email: order.user_email,
        Date: new Date(order.created_datetime).toLocaleString(),
        Item: item.name,
        Quantity: item.quantity,
        Price: item.price,
        Total_Paid:
          index === 0
            ? order.order_details.reduce((sum, d) => sum + d.total, 0) +
              (order.round_off || 0)
            : "",
      }))
    );

    // ✅ Add grand total row
    rows.push({
      Stall: "",
      Token: "",
      Email: "",
      Date: "",
      Item: "",
      Quantity: "",
      Price: "",
      Total: "",
      Total_Paid: "Grand Total: ₹" + totalSales.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Outlet Sales Report");
    XLSX.writeFile(wb, "Stall_Sales_Report.xlsx");
  };

  return (
    <div className="stall-sales-report">
      <h2>Outlet Sales Report</h2>

    <div className="filter-row">
  {/* Stall Dropdown */}
  <div className="stall-dropdown">
    <label htmlFor="stall-select">Select Outlet:</label>
    <select
      id="stall-select"
      value={selectedStallId}
      onChange={(e) => setSelectedStallId(e.target.value)}
    >
      <option value="all">All Outlets</option>
      {stalls.map((stall) => (
        <option key={stall.id} value={stall.id}>
          {stall.name}
        </option>
      ))}
    </select>
  </div>

  {/* Sort Options */}
  <div className="sort-options">
    <label htmlFor="sort-select">Sort By:</label>
    <select
      id="sort-select"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
    >
      <option value="stall">Outlet</option>
      <option value="date">Date</option>
    </select>
  </div>

  {/* Company Filter */}
  <div className="company-filter">
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

      {/* Date Filters */}
      <div className="filter-options">
        <button onClick={() => setFilter("today")}>Today</button>
        <button onClick={() => setFilter("week")}>This Week</button>
        <button onClick={() => setFilter("month")}>This Month</button>
        <button onClick={() => setFilter("custom")}>Custom</button>
        <button onClick={() => setFilter("all")}>All</button>

        {filter === "custom" && (
          <div className="custom-range">
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

      {/* Company Filter */}
     

      {/* Export */}
      <div className="export-btn">
        <button onClick={exportToExcel}>Export to Excel</button>
      </div>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* If no orders but stall exists */}
      {!loading && !error && companyFilteredOrders.length === 0 && (
        <div>
          <p>No orders found for this range.</p>
          {stalls.length > 0 && (
            <ul>
              {stalls.map((stall) => (
                <li key={stall.id}>{stall.name} - No orders yet</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Report Table */}
      {companyFilteredOrders.length > 0 && (
        <>
          <h3>Grand Total Sales: ₹{totalSales.toFixed(2)}</h3>
          <table>
            <thead>
              <tr>
                <th>Outlet</th>
                <th>Token</th>
                <th>User Email</th>
                <th>Date</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {companyFilteredOrders.map((order) =>
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
