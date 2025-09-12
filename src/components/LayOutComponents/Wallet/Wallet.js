import React, { useState, useEffect, useCallback } from 'react';
import {
  addMoneyToWallet,
  fetchBuildingByAdminId,
  fetchWalletsByBuildingId,
  fetchUserById
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import './Wallet.css';

export default function AddMoney() {
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [retainable, setRetainable] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { token, userId } = useAuth();

  // ✅ Memoize loadWallets
  const loadWallets = useCallback(async (bId) => {
    try {
      const wallets = await fetchWalletsByBuildingId(bId, token);
      setWallets(wallets);

      // Fetch user info for each wallet
      const userDetails = {};
      await Promise.all(wallets.map(async (wallet) => {
        if (!userDetails[wallet.user_id]) {
          try {
            const user = await fetchUserById(wallet.user_id, token);
            userDetails[wallet.user_id] = user;
          } catch (error) {
            console.error(`Error fetching user ${wallet.user_id}:`, error);
          }
        }
      }));
      setUserMap(userDetails);
    } catch (err) {
      console.error('Error loading wallets:', err);
      setWallets([]);
    }
  }, [token]);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildings = await fetchBuildingByAdminId(userId, token);
        if (buildings.length > 0) {
          setBuildings(buildings);
          setBuildingId(buildings[0].id);
          loadWallets(buildings[0].id);
        } else {
          setError('No buildings found for this admin.');
        }
      } catch (err) {
        console.error("Error fetching buildings:", err);
        setError('Failed to fetch building data.');
      }
    };

    if (userId) {
      loadBuildings();
    }
  }, [userId, token, loadWallets]); // ✅ Added loadWallets here

  const handleBuildingChange = (e) => {
    const selectedId = e.target.value;
    setBuildingId(selectedId);
    setSuccess('');
    setError('');
    loadWallets(selectedId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!buildingId) {
      setError('Building ID is not selected.');
      return;
    }

    try {
      const payload = {
        identifier: identifier.trim(),
        wallet_amount: parseFloat(amount),
        is_retainable: retainable,
        building_id: buildingId,
      };

      await addMoneyToWallet(payload, token);
      setSuccess(`✅ ₹${amount} added successfully to wallet`);
      setIdentifier('');
      setAmount('');
      loadWallets(buildingId); // Refresh wallet list
    } catch (err) {
      console.error("Error adding money:", err);
      setError(err.response?.data?.detail || '❌ Something went wrong.');
    }
  };

  return (
    <AdminLayout>
      <div className="add-money-container">
        <h2>Add Money to Wallet</h2>
        <form onSubmit={handleSubmit} className="add-money-form">
          <select value={buildingId} onChange={handleBuildingChange} required>
            <option value="">Select a Building</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.building_name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Mobile number or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="checkbox-container">
            <input
              type="checkbox"
              id="retainable"
              checked={retainable}
              onChange={(e) => setRetainable(e.target.checked)}
            />
            <label htmlFor="retainable">Retainable</label>
          </div>

          <button type="submit">Add Money</button>
        </form>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        {wallets.length > 0 && (
          <div className="wallet-section">
            <h3>Wallets in this Building</h3>
            <ul className="wallet-list">
              {wallets.map((wallet) => {
                const user = userMap[wallet.user_id] || {};
                return (
                  <li key={wallet.id} className="wallet-item">
                    <strong>User:</strong> {user.name || 'Unknown'}<br />
                    <strong>Email:</strong> {user.company_email || 'N/A'}<br />
                    <strong>Phone:</strong> {user.phone_number || 'N/A'}<br />
                    <strong>Wallet Amount:</strong> ₹{wallet.wallet_amount}<br />
                    <strong>Balance:</strong> ₹{wallet.balance_amount}<br />
                    <strong>Retainable:</strong> {wallet.is_retainable ? 'Yes' : 'No'}<br />
                    <strong>Expires At:</strong> {wallet.expiry_at ? new Date(wallet.expiry_at).toLocaleString() : 'N/A'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
