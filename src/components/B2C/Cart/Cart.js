import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { useB2CAuth } from "../../AuthContex/B2CContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./Cart.css";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? `http://${window.location.hostname}:8000`
    : "https://admin-aged-field-2794.fly.dev";
const S3_BASE_URL = "https://fliplyn-assets.s3.ap-south-1.amazonaws.com/";

export default function B2CCart() {
  const { b2cUser, token } = useB2CAuth();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ---------------- PHONEPE QR MODAL STATES ---------------- */
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [modalError, setModalError] = useState("");
  const [cfOrderId, setCfOrderId] = useState("");

  // Load from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("b2c_cartItems")) || [];
    console.log("🛒 Loaded B2C cart items from localStorage:", stored);
    setCartItems(stored);
  }, []);

  // Update quantity and log the updates
  const updateQuantity = (itemId, newQty) => {
    let updated = [...cartItems];

    if (newQty <= 0) {
      updated = updated.filter((item) => item.id !== itemId);
    } else {
      updated = updated.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      );
    }

    setCartItems(updated);
    localStorage.setItem("b2c_cartItems", JSON.stringify(updated));
    window.dispatchEvent(new Event("b2c-cart-updated"));
  };

  /* ---------------- HELPERS ---------------- */
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
      setError("⚠️ Payment was failed. Please try again.");
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

    console.log("=== STARTING B2C QR STATUS POLLING (FROM CART) ===");
    const intervalId = setInterval(async () => {
      try {
        const url = `${API_BASE_URL}/orders/verify-payment/phonepe/${cfOrderId}`;
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
        console.error("B2C Polling status error from cart:", err);
      }
    }, 2500);

    return () => {
      console.log("=== CLEANING UP B2C POLLING ===");
      clearInterval(intervalId);
    };
  }, [showQrModal, qrValue, cfOrderId, navigate, token]);

  // Send to backend + log + initiate PhonePe Order direct checkout
  const handleProceed = async () => {
    if (cartItems.length === 0) return;
    if (!b2cUser || !token) {
      setError("User not authenticated");
      return;
    }

    if (!b2cUser?.phone_number || !b2cUser?.email) {
      setError("User phone or email details missing. Please update your profile.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Sync cart with backend
      const cartPayload = {
        user_id: b2cUser.id,
        items: cartItems.map((i) => ({
          item_id: i.id,
          quantity: i.quantity,
          Gst_precentage: i.Gst_precentage || 0,
        })),
      };

      console.log("📦 B2C Basket sync payload:", cartPayload);

      await axios.post(`${API_BASE_URL}/cart/add-multiple`, cartPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 2: Create order on backend directly requesting PhonePe
      const itemsPayload = cartItems.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        user_id: b2cUser.id,
        user_phone: b2cUser.phone_number,
        user_email: b2cUser.email,
        items: itemsPayload,
        pay_with_wallet: false,
        payment_gateway: "phonepe",
        cashfree_return_url: `${window.location.origin}/b2c/success`,
      };

      console.log("📦 Placing PhonePe order directly from basket:", orderPayload);

      const orderRes = await axios.post(`${API_BASE_URL}/orders/place`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const backendOrder = orderRes.data;

      if (!backendOrder.payment_session_id) {
        setError("Failed to generate payment QR code");
        return;
      }

      setQrValue(backendOrder.payment_session_id);
      setCfOrderId(backendOrder.cashfree_order_id);
      setTimeLeft(180);
      setModalError("");
      setShowQrModal(true);

    } catch (err) {
      console.error("❌ B2C Checkout direct payment failed:", err);
      setError(err?.response?.data?.detail || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalGST = cartItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity * ((item.Gst_precentage || 0) / 100),
    0
  );

  const total = subtotal + totalGST;
  const finalTotal = Math.round(total);



  return (
    <>
      <Header />
      <div className="cart-page">
        <h2 className="heading">Your Basket</h2>

        {error && <div className="cart-error">{error}</div>}

        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-emoji">🛒</div>
            <h3>Your basket is empty</h3>
            <p>Add items from a stall to get started</p>
          </div>
        ) : (
          <>
            <div className="cart-wrapper">
              <div className="cart-grid">
                {cartItems.map((item) => {
                  const imageUrl = item.image_url?.startsWith("http")
                    ? item.image_url
                    : `${S3_BASE_URL}${item.image_url}`;

                  return (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-item-row">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.src = "/fallback-item.jpg";
                          }}
                        />

                        <div className="item-info">
                          <p className="item-name">{item.name}</p>
                        </div>

                        <div className="price-and-qty">
                          <p className="price-text">₹{item.price}</p>

                          <div className="quantity-box">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="add-more-btn" onClick={() => navigate(-1)}>
                  ADD MORE ITEMS
                </button>
              </div>
            </div>

            {/* Summary section */}
            <div className="cart-summary">
              <p>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </p>

              <hr />

              <h3>
                <span>Total</span>
                <span>₹{finalTotal.toFixed(0)}</span>
              </h3>
            </div>

            {/* Bottom Buttons */}
            <div className="sticky-bottom">
              <button className="payment-btn" onClick={handleProceed} disabled={loading}>
                {loading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </>
        )}
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
            <p className="qr-amount">Amount: ₹ {finalTotal.toFixed(2)}</p>

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
