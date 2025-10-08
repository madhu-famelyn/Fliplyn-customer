import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import "./AddWallet.css";

export default function WalletUpload() {
  const { token, user: manager } = useAuth();
  const [walletAmount, setWalletAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [fetchingWallets, setFetchingWallets] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  // ✅ Fetch manager details and wallets
  useEffect(() => {
    if (!manager?.id) return;
    const fetchManagerDetails = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/managers/${manager.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const building_id = res.data.building_id || "";
        setBuildingId(building_id);
        if (building_id) fetchWallets(building_id);
      } catch (err) {
        console.error("Error fetching manager details:", err);
      }
    };
    fetchManagerDetails();
  }, [manager, token]);

  // ✅ Fetch wallets
// ✅ Fetch wallets and user names
const fetchWallets = async (building_id) => {
  setFetchingWallets(true);
  try {
    const res = await axios.get(
      `http://localhost:8000/wallets/by-building/${building_id}/images`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const walletsData = res.data;

    // 🔹 Fetch user details for each wallet
    const walletsWithUser = await Promise.all(
      walletsData.map(async (wallet) => {
        try {
          const userRes = await axios.get(
            `http://localhost:8000/user/${wallet.user_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return {
            ...wallet,
            user_name: userRes.data.name || "Unknown",
          };
        } catch (err) {
          console.error(`Error fetching user ${wallet.user_id}:`, err);
          return { ...wallet, user_name: "Unknown" };
        }
      })
    );

    setWallets(walletsWithUser);
  } catch (err) {
    console.error("Error fetching wallets:", err);
  } finally {
    setFetchingWallets(false);
  }
};


  // ✅ Create Wallet
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletAmount || !userEmail) {
      setMessage("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("wallet_amount", walletAmount);
    formData.append("identifier", userEmail);
    formData.append("building_id", buildingId);
    formData.append("is_retainable", true);
    formData.append("payment_method", "PREPAID");
    if (image) formData.append("file", image);

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:8000/wallets/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("✅ Wallet created successfully!");
      console.log("Wallet Response:", res.data);

      setWalletAmount("");
      setUserEmail("");
      setImage(null);

      if (buildingId) fetchWallets(buildingId);
    } catch (err) {
      console.error("Error creating wallet:", err.response || err);
      setMessage("❌ Failed to create wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-container">
      <div className="header-row">
        <h2>Wallet Management</h2>
        <button
          className="orange-btn"
          onClick={() => setFormVisible(!formVisible)}
        >
          {formVisible ? "Close Form" : "Add Wallet"}
        </button>
      </div>

      {/* Wallet Form */}
      {formVisible && (
        <form className="wallet-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Wallet Amount</label>
            <input
              type="number"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="form-group">
            <label>User Email / Phone</label>
            <input
              type="text"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Enter user email or phone"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <button type="submit" disabled={loading} className="orange-btn">
            {loading ? "Creating..." : "Create Wallet"}
          </button>

          {message && <p className="status-message">{message}</p>}
        </form>
      )}

      {/* Wallet Table */}
      <h3>Wallets</h3>
      {fetchingWallets && <p>Loading wallets...</p>}
      {!fetchingWallets && wallets.length === 0 && (
        <p>No wallets found.</p>
      )}

      {wallets.length > 0 && (
        <table className="wallet-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Wallet Amount</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id}>
                <td>{w.user_name || "Unknown"}</td>
                <td>{w.wallet_amount}</td>
                <td>
                  {w.image_path ? (
                    <img
                      src={w.image_path}
                      alt="wallet"
                      className="thumbnail"
                      onClick={() => setPopupImage(w.image_path)}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Popup Image Modal */}
      {popupImage && (
        <div className="popup-overlay" onClick={() => setPopupImage(null)}>
          <div className="popup-content">
            <img src={popupImage} alt="Popup" />
          </div>
        </div>
      )}
    </div>
  );
}
