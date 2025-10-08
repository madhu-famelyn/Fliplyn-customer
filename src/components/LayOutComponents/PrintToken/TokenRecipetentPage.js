// src/pages/token/TokenReceiptPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./PrintToken.css";
import TokenHeader from "./Header";

export default function TokenReceiptPage() {
  const { tokenNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/orders/orders/by-token/${tokenNumber}`
        );
        setOrder(res.data);
      } catch (err) {
        console.error(err);
        setError("Order not found for this token.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [tokenNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
        <TokenHeader/>
   
    <div className="token-page">
      {order && (
        <div id="print-area" className="receipt">
          <h2>Forno Bakery</h2>
          <p className="token-info">
            Token No.: <strong>{order.token_number}</strong>
          </p>
          <hr />
          <p className="date">
            Date: {new Date(order.created_datetime).toLocaleString()}
          </p>
          <hr />

          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty.</th>
                <th>Price (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {order.order_details.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.total.toFixed(2)}</td>
                </tr>
              ))}
            <tr className="cgst-row">
                <td>CGST</td>
            <td></td>
                <td>{order.cgst.toFixed(2)}</td>
            </tr>
            <tr className="sgst-row">
                <td>SGST</td>
            <td></td>
                <td>{order.sgst.toFixed(2)}</td>
            </tr>

              <tr>
                <td><strong>Total GST</strong></td>
                <td></td>
                <td>{order.total_gst.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total (Rs)</td>
                <td></td>
                <td>{order.total_amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Round Off (Rs)</td>
                <td></td>
                <td>
                  {order.round_off >= 0 ? "+" : "-"} {order.round_off.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan="2"><strong>Grand Total (Rs)</strong></td>
                <td><strong>{(order.total_amount + order.round_off).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h4>Thank you!</h4>
          <button onClick={handlePrint} className="print-btn">
            Print
          </button>
        </div>
      )}
    </div>
     </div>
  );
}
