import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Payment.css";
import { SiPhonepe } from "react-icons/si";
import { useB2CAuth } from "../../AuthContex/B2CContext";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE =
  window.location.hostname === "localhost"
    ? `http://${window.location.hostname}:8000`
    : "https://admin-aged-field-2794.fly.dev";

export default function B2CPayment() {
  const { b2cUser, token } = useB2CAuth();
  const navigate = useNavigate();
  const userId = b2cUser?.id;

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ---------------- PHONEPE QR MODAL STATES ---------------- */
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [modalError, setModalError] = useState("");
  const [cfOrderId, setCfOrderId] = useState("");

  /* ---------------- CART ---------------- */
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
    setCartItems(storedCart);
  }, []);

  const calculateTotalAmount = () =>
    cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

  const createInternalOrder = async (payload) => {
    const res = await axios.post(`${API_BASE}/orders/place`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPayeeName = () => {
    if (!qrValue) return "Neos Group";
    try {
      const urlParams = new URLSearchParams(qrValue.replace(/^upi:\/\/pay\?/, ""));
      const pn = urlParams.get("pn");
      return pn ? decodeURIComponent(pn) : "Neos Group";
    } catch (e) {
      return "Neos Group";
    }
  };

  /* ---------------- TIMER EFFECT ---------------- */
  useEffect(() => {
    if (!showQrModal) return;

    if (timeLeft <= 0) {
      alert("Payment session expired. Please try again.");
      setShowQrModal(false);
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [showQrModal, timeLeft]);

  /* ---------------- STATUS POLLING EFFECT ---------------- */
  useEffect(() => {
    if (!showQrModal || !qrValue || !cfOrderId) return;

    console.log("=== STARTING B2C QR STATUS POLLING ===");
    const intervalId = setInterval(async () => {
      try {
        const url = `${API_BASE}/orders/verify-payment/phonepe/${cfOrderId}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.payment_status === "SUCCESS") {
          console.log("=== B2C PAYMENT DETECTED SUCCESS ===");
          clearInterval(intervalId);
          setShowQrModal(false);

          // Clear cart
          localStorage.removeItem("b2c_cartItems");
          window.dispatchEvent(new Event("b2c-cart-updated"));

          // Navigate to B2C success receipt page
          navigate("/b2c/success", { state: { order: { id: res.data.order_id } } });
        }
      } catch (err) {
        console.error("B2C Polling status error:", err);
      }
    }, 2500);

    return () => {
      console.log("=== CLEANING UP B2C POLLING ===");
      clearInterval(intervalId);
    };
  }, [showQrModal, qrValue, cfOrderId, navigate, token]);

  /* ---------------- CONFIRM PAYMENT ---------------- */
  const handleConfirmPayment = async () => {
    setErrorMsg("");

    if (!cartItems.length) {
      setErrorMsg("Cart is empty");
      return;
    }

    if (!userId || !b2cUser?.phone_number || !b2cUser?.email) {
      setErrorMsg("User details (phone or email) are missing. Please update your profile.");
      return;
    }

    const itemsPayload = cartItems.map((item) => ({
      item_id: item.id,
      quantity: item.quantity,
    }));

    const orderPayload = {
      user_id: userId,
      user_phone: b2cUser.phone_number,
      user_email: b2cUser.email,
      items: itemsPayload,
      pay_with_wallet: false, // B2C has no wallet
      payment_gateway: "phonepe",
      cashfree_return_url: `${window.location.origin}/b2c/success`,
    };

    try {
      setIsLoading(true);

      const backendOrder = await createInternalOrder(orderPayload);

      if (!backendOrder.payment_session_id) {
        setErrorMsg("Failed to generate payment session");
        return;
      }
      console.log("PhonePe QR Code String:", backendOrder.payment_session_id);
      console.log("PhonePe transaction ID:", backendOrder.cashfree_order_id);

      setQrValue(backendOrder.payment_session_id);
      setCfOrderId(backendOrder.cashfree_order_id);
      setTimeLeft(180);
      setModalError("");
      setShowQrModal(true);

    } catch (err) {
      console.error(err);
      setErrorMsg("Payment checkout failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <Header />

      <div className="payment-page-container">
        <h2 className="payment-title">Checkout</h2>

        <div className="payment-methods">
          <button
            className="method-btn selected"
            disabled={isLoading}
          >
            <SiPhonepe className="phonepe-icon-style" /> PhonePe / UPI QR Code
          </button>
        </div>

        <div className="cart-summary-box">
          <h3 className="cart-title">Order Items</h3>

          {!cartItems.length ? (
            <p className="empty-cart-msg">No items in cart</p>
          ) : (
            <>
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item-row">
                  <span>{item.name}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>₹ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="cart-total-row">
                <strong>Total:</strong>
                <strong>₹ {calculateTotalAmount().toFixed(2)}</strong>
              </div>
            </>
          )}
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <div className="payment-buttons">
          <button
            className="confirm-btn"
            onClick={handleConfirmPayment}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Pay Now"}
          </button>

          <button
            className="continue-btn"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>

      {showQrModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-card">
            <h2>Scan & Pay</h2>
            <p>Scan using any UPI App (GPay, PhonePe, Paytm)</p>
            <div className="qr-canvas-container">
              <QRCodeCanvas value={qrValue} size={280} includeMargin={true} level="H" />
            </div>
            <p className="payee-name-sub">Paying to: <strong>{getPayeeName()}</strong></p>
            <p className="qr-amount">Amount: ₹ {calculateTotalAmount().toFixed(2)}</p>

            {modalError && (
              <div className="modal-error-callout" style={{
                background: "#fff9db",
                border: "1px solid #ffe066",
                color: "#856404",
                padding: "10px 14px",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "16px",
                textAlign: "left",
                lineHeight: "1.4"
              }}>
                ⚠️ {modalError}
              </div>
            )}



            <p className="qr-timer-text">Expires in: <span className="timer-count">{formatTime(timeLeft)}</span></p>

            <button className="qr-close-btn" onClick={() => setShowQrModal(false)}>Cancel Payment</button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
