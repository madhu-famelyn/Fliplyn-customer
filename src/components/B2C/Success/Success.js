import React, { useEffect, useState, useRef } from "react";
import "./Success.css";
import { useLocation, useNavigate } from "react-router-dom";
import { BsCheck } from "react-icons/bs";
import axios from "axios";

const API_BASE =
  window.location.hostname === "localhost"
    ? `http://${window.location.hostname}:8000`
    : "https://admin-aged-field-2794.fly.dev";

export default function B2CPaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const view = "receipt";
  const [showToken, setShowToken] = useState(false);
  const receiptRef = useRef(null);

  // ⏱ Show token after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToken(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // 🖨️ Auto-print token once it is generated and visible
  useEffect(() => {
    if (showToken && orderDetails) {
      const printTimer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(printTimer);
    }
  }, [showToken, orderDetails]);


  useEffect(() => {
    const order = location.state?.order;
    if (order?.id) {
      axios
        .get(`${API_BASE}/orders/${order.id}`)
        .then((res) => {
          setOrderDetails(res.data);
          // Clear cart
          localStorage.removeItem("b2c_cartItems");
          window.dispatchEvent(new Event("b2c-cart-updated"));
        })
        .catch((err) => console.error("Error fetching order:", err));
    } else {
      const searchParams = new URLSearchParams(location.search);
      const cfOrderId = searchParams.get("cf_order_id") || searchParams.get("order_id");
      if (cfOrderId) {
        axios
          .get(`${API_BASE}/orders/by-cashfree/${cfOrderId}`)
          .then((res) => {
            setOrderDetails(res.data);
            // Clear cart
            localStorage.removeItem("b2c_cartItems");
            window.dispatchEvent(new Event("b2c-cart-updated"));
          })
          .catch((err) => console.error("Error fetching order by cashfree:", err));
      }
    }
  }, [location]);



  if (!orderDetails) return <p className="loading-text">Loading...</p>;

  const tokenNo = orderDetails.token_number ?? orderDetails.id.slice(0, 4);
  const createdAt = new Date(orderDetails.created_datetime).toLocaleString(
    "en-IN",
    { hour12: true, timeZone: "Asia/Kolkata" }
  );

  const totalCgst = orderDetails.cgst ?? 0;
  const totalSgst = orderDetails.sgst ?? 0;
  const totalGst = orderDetails.total_gst ?? totalCgst + totalSgst;
  const roundOff = orderDetails.round_off ?? 0;
  const grandTotal = orderDetails.total_amount ?? 0;
  const subtotal = grandTotal - roundOff;

  return (
    <div className="receipt-wrapper">
      <div className="payment-success-header">
        <div className="success-checkmark-glow">
          <span className="success-checkmark-icon">
            <BsCheck />
          </span>
        </div>
        <h1 className="success-title">Payment Successful</h1>
        <p className="success-subtitle">Thank you for your order!</p>
      </div>

      {/* ⚠️ Validity Message (First 10 seconds) */}
      {!showToken && (
        <div className="order-validity-box">
          <div className="token-generation-alert">
            <div className="token-spinner-ring"></div>
            <p className="token-alert-title">Generating Your Order Token...</p>
            <p className="token-alert-subtitle">Please do not close this window or refresh the page.</p>
          </div>
          <p className="order-validity-text" style={{ marginTop: "12px", borderTop: "1px solid #fde68a", paddingTop: "8px" }}>
            This order is valid for <strong>30 minutes</strong>.  
            After 30 minutes, the order will not be processed and the amount will not be refunded.
          </p>
        </div>
      )}

      {/* 🎟 Token / Receipt */}
      {showToken && (
        <>
          {view === "receipt" && (
            <>
              <div id="print-area" className="receipt-card compact-token" ref={receiptRef}>
                <h2 className="stall-name">
                  {orderDetails.order_details[0]?.stall_name || "Stall Name"}
                </h2>
                
                <div className="token-hero-badge">
                  <span className="token-hero-label">YOUR TOKEN NUMBER</span>
                  <h3 className="token-hero-number">{tokenNo}</h3>
                </div>

                <p className="order-date">Date: {createdAt}</p>

                <hr className="separator" />

                <div className="token-table">
                  <div className="token-header">
                    <span>Item</span>
                    <span>Rs</span>
                  </div>

                  {orderDetails.order_details.map((item, index) => (
                    <div key={index} className="token-row">
                      <span className="item-name">{item.name} × {item.quantity}</span>
                      <span>{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="token-summary">
                  <p><span>CGST</span><span>{totalCgst.toFixed(2)}</span></p>
                  <p><span>SGST</span><span>{totalSgst.toFixed(2)}</span></p>
                  <p><span>Total GST</span><span>{totalGst.toFixed(2)}</span></p>
                  <p><span>Total</span><span>{subtotal.toFixed(2)}</span></p>
                  <p><span>Round Off</span><span>{roundOff.toFixed(2)}</span></p>
                  <div className="separator" style={{ margin: "10px 0" }}></div>
                  <p className="grand-total">
                    <span>Grand Total</span>
                    <span>₹ {grandTotal.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <button className="download-btn" onClick={() => window.print()}>
                Print Token
              </button>
            </>
          )}

          {/* 🔙 Back to Stalls */}
          <button
            className="back-to-stalls-btn"
            onClick={() => navigate("/b2c/stalls")}
          >
            Back to Stalls
          </button>
        </>
      )}
    </div>
  );
}
