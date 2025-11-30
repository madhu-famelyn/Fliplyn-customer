import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/AdminContext";

export default function WalletUploadAdmin() {
  const { token, adminId } = useAuth(); // ✅ Extract adminId
  const [walletAmount, setWalletAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWallets, setFetchingWallets] = useState(false);
  const [message, setMessage] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  // Fetch wallets for a building
  const fetchWallets = useCallback(
    async (building_id) => {
      if (!token) return;
      setFetchingWallets(true);
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/wallets/by-building/${building_id}/images`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const walletsData = res.data;

        const walletsWithUser = await Promise.all(
          walletsData.map(async (wallet) => {
            try {
              const userRes = await axios.get(
                `https://admin-aged-field-2794.fly.dev/user/${wallet.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { ...wallet, user_name: userRes.data.name || "Unknown" };
            } catch (err) {
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
    },
    [token]
  );

  // Fetch all buildings for admin
  useEffect(() => {
    if (!adminId) return;

    const fetchBuildings = async () => {
      try {
        const res = await axios.get(
          `https://admin-aged-field-2794.fly.dev/buildings/buildings/buildings/by-admin/${adminId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBuildings(res.data || []);
        // If admin has at least one building, select the first by default
        if (res.data?.length > 0) {
          setBuildingId(res.data[0].id);
          fetchWallets(res.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching buildings:", err);
      }
    };

    fetchBuildings();
  }, [adminId, token, fetchWallets]);

  // Handle wallet creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletAmount || !userEmail || !buildingId) {
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

      await axios.post(
        "https://admin-aged-field-2794.fly.dev/wallets/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("✅ Wallet created successfully!");
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

      {formVisible && (
        <form className="wallet-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Building</label>
            <select
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                fetchWallets(e.target.value);
              }}
              required
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.id}
                </option>
              ))}
            </select>
          </div>

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

      <h3>Wallets</h3>

      {fetchingWallets && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}

      {!fetchingWallets && wallets.length === 0 && <p>No wallets found.</p>}

      {wallets.length > 0 && (
        <div className="table-wrapper">
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
                  <td>₹{w.wallet_amount}</td>
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
        </div>
      )}

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
