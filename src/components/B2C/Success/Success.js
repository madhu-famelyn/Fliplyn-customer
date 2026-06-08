import React, { useEffect, useState, useRef } from "react";
import "./Success.css";
import { useLocation, useNavigate } from "react-router-dom";
import { BsCheck } from "react-icons/bs";
import axios from "axios";
import { printViaRawBT } from "../../../utils/printHelper";

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
  const [clientToken, setClientToken] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate a simple 4‑digit token if none exists from the backend
  useEffect(() => {
    if (!orderDetails?.token_number && orderDetails?.id) {
      const fallback = Math.floor(1000 + Math.random() * 9000).toString();
      setClientToken(fallback);
    }
  }, [orderDetails]);

  const hasPrintedRef = useRef(false);

  // Show token as soon as order details are available, trigger print, and redirect
  useEffect(() => {
    if (orderDetails && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setShowToken(true);
      // Print automatically once the token is ready
      handlePrint();

      // Automatically navigate back to stalls page after 5 seconds
      const timer = setTimeout(() => {
        navigate("/b2c/stalls");
      }, 5000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDetails]);

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Defer the print trigger to give the browser time to render and paint the overlay
    setTimeout(() => {
      if (window.Android && typeof window.Android.printToken === "function") {
        window.Android.printToken(JSON.stringify(orderDetails));
      } else if (window.iMinPrinter && typeof window.iMinPrinter.printReceipt === "function") {
        window.iMinPrinter.printReceipt(JSON.stringify(orderDetails));
      } else {
        printViaRawBT(orderDetails);
      }
    }, 1000);

    setTimeout(() => {
      setIsPrinting(false);
    }, 5000);
  };

  // Auto‑print is now triggered directly when the token becomes visible
  // (see the token‑show useEffect above). The previous separate auto‑print effect has been removed.


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

  // Token number – use server‑provided value or generate a fallback locally
  const tokenNo = orderDetails.token_number
    ? orderDetails.token_number
    : clientToken || orderDetails.id.slice(0, 4);
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

              <button className="download-btn" onClick={handlePrint}>
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

      {isPrinting && (
        <div className="print-overlay-backdrop">
          <div className="print-overlay-box">
            <div className="print-overlay-spinner"></div>
            <p className="print-overlay-title">Please Wait</p>
            <p className="print-overlay-subtitle">Printing your token receipt...</p>
          </div>
        </div>
      )}
    </div>
  );
}
