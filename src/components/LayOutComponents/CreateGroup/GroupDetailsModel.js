import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./CreateGroup.css";

const GroupDetailsModal = ({ groupId, token, onClose }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);

  // New states for filtering/sorting
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/wallet-group/${groupId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGroupDetails(res.data);
      } catch (error) {
        console.error("❌ Failed to fetch group details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchGroupDetails();
  }, [groupId, token]);

  const downloadUserExcel = () => {
    if (!groupDetails?.users?.length) return;
    try {
      const ws = XLSX.utils.json_to_sheet(groupDetails.users);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Group Users");
      XLSX.writeFile(
        wb,
        `${groupDetails.group_name || "Unnamed Group"}_Users.xlsx`
      );
    } catch (err) {
      console.error("❌ Error while generating User Excel:", err);
    }
  };

  const fetchAllOrders = async () => {
    if (!groupDetails?.users?.length) return;
    setOrdersLoading(true);
    try {
      const allFetchedOrders = [];
      for (let user of groupDetails.users) {
        try {
          const res = await axios.get(
            `https://admin-aged-field-2794.fly.dev/orders/user/${user.user_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const walletOrders = res.data.filter(
            (order) => order.paid_with_wallet === true
          );
          walletOrders.forEach((order) => {
            allFetchedOrders.push({
              ...order,
              user_email: user.email,
              user_phone: user.phone,
            });
          });
        } catch (error) {
          console.error(`❌ Failed to fetch orders for ${user.user_id}:`, error);
        }
      }
      setAllOrders(allFetchedOrders);
      setShowAllOrdersModal(true);
    } catch (error) {
      console.error("❌ Error fetching all orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Filter + sort orders
  const filteredOrders = allOrders
    .filter((order) => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(order.created_datetime);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      if (from && orderDate < from) return false;
      if (to && orderDate > to) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_datetime);
      const dateB = new Date(b.created_datetime);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const downloadFilteredOrdersExcel = () => {
    if (!filteredOrders.length) return;
    try {
      const ordersData = filteredOrders.flatMap((order) =>
        order.order_details.map((item) => ({
          Email: order.user_email,
          Phone: order.user_phone,
          Date: new Date(order.created_datetime).toLocaleString(),
          ItemName: item.name,
          Description: item.description || "",
          Price: item.price,
          Quantity: item.quantity,
          Total: item.total,
          GST: item.gst,
          CGST: order.cgst,
          SGST: order.sgst,
          TotalGST: order.total_gst,
          RoundOff: order.round_off,
          TotalAmount: order.total_amount,
          PaidWithWallet: order.paid_with_wallet ? "Yes" : "No",
          TokenNumber: order.token_number,
        }))
      );
      const ws = XLSX.utils.json_to_sheet(ordersData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Filtered Orders");
      XLSX.writeFile(
        wb,
        `Filtered_Orders_${groupDetails.group_name || "Group"}.xlsx`
      );
    } catch (err) {
      console.error("❌ Error generating filtered Orders Excel:", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-details">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h3>Group Details</h3>

        {detailsLoading ? (
          <p>Loading details...</p>
        ) : groupDetails ? (
          <>
            <p>
              <strong>Group Name:</strong>{" "}
              {groupDetails.group_name || "Unnamed Group"}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(groupDetails.created_datetime).toLocaleString()}
            </p>

            <h4>Users (Paid with Wallet)</h4>
            {groupDetails.users?.length > 0 ? (
              <>
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupDetails.users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button className="download-btn" onClick={downloadUserExcel}>
                  Download Users as Excel
                </button>

                <button
                  className="view-orders-btn"
                  onClick={fetchAllOrders}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? "Loading Orders..." : "View All Orders"}
                </button>
              </>
            ) : (
              <p>No users found in this group.</p>
            )}
          </>
        ) : (
          <p>Unable to load group details.</p>
        )}
      </div>

      {/* All Orders Modal */}
      {showAllOrdersModal && (
        <div className="modal-overlay">
          <div className="modal-details">
            <button
              className="close-btn"
              onClick={() => setShowAllOrdersModal(false)}
            >
              ✖
            </button>
            <h3>All Orders</h3>

            {/* Date Filter & Sorting */}
            <div className="date-filters">
              <label>
                From:{" "}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label>
                To:{" "}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
              <label>
                Sort:{" "}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </label>
            </div>

            {filteredOrders.length > 0 ? (
              <>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) =>
                      order.order_details.map((item, i) => (
                        <tr key={`${idx}-${i}`}>
                          <td>{order.user_email}</td>
                          <td>{order.user_phone}</td>
                          <td>
                            {new Date(order.created_datetime).toLocaleString()}
                          </td>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price}</td>
                          <td>₹{item.total}</td>
                          <td>₹{item.gst}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <button
                  className="download-btn"
                  onClick={downloadFilteredOrdersExcel}
                >
                  Download Filtered Orders as Excel
                </button>
              </>
            ) : (
              <p>No orders found for selected date range.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsModal;
