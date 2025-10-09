import React, { useState, useEffect, useCallback } from 'react';
import {
  addMoneyToWallet,
  fetchBuildingByAdminId,
  fetchWalletsByBuildingId,
  fetchUserById
} from './Service';
import { useAuth } from '../../AuthContex/AdminContext';
import AdminLayout from '../../LayOut/AdminLayout';
import './Wallet.css';

export default function AddMoney() {
  const [showForm, setShowForm] = useState(false);
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

  // ✅ Load wallets for a building
  const loadWallets = useCallback(
    async (bId) => {
      try {
        const walletsData = await fetchWalletsByBuildingId(bId, token);
        setWallets(walletsData);

        // Fetch user info for each wallet.user_id
        const userDetails = {};
        await Promise.all(
          walletsData.map(async (wallet) => {
            if (!userDetails[wallet.user_id]) {
              try {
                const user = await fetchUserById(wallet.user_id, token);
                userDetails[wallet.user_id] = {
                  name: user.name || 'Unknown',
                  email: user.company_email || 'N/A',
                  phone: user.phone_number || 'N/A',
                };
              } catch (error) {
                console.error(`Error fetching user ${wallet.user_id}:`, error);
                userDetails[wallet.user_id] = {
                  name: 'Unknown',
                  email: 'N/A',
                  phone: 'N/A',
                };
              }
            }
          })
        );

        setUserMap(userDetails);
      } catch (err) {
        console.error('Error loading wallets:', err);
        setWallets([]);
      }
    },
    [token]
  );

  // ✅ Load buildings on mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await fetchBuildingByAdminId(userId, token);
        if (buildingsData.length > 0) {
          setBuildings(buildingsData);
          setBuildingId(buildingsData[0].id);
          loadWallets(buildingsData[0].id);
        } else {
          setError('No buildings found for this admin.');
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to fetch building data.');
      }
    };

    if (userId) {
      loadBuildings();
    }
  }, [userId, token, loadWallets]);

  // ✅ Building change
  const handleBuildingChange = (e) => {
    const selectedId = e.target.value;
    setBuildingId(selectedId);
    setSuccess('');
    setError('');
    loadWallets(selectedId);
  };

  // ✅ Submit form
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
      console.error('Error adding money:', err);
      setError(err.response?.data?.detail || '❌ Something went wrong.');
    }
  };

  return (
    <AdminLayout>
      <div className="add-money-container">
        <div className="form-header">
          <h2>Add Money to Wallet</h2>
          <button
            type="button"
            className="open-form-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close Form' : 'Open Form'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="add-money-form">
            <select value={buildingId} onChange={handleBuildingChange} required>
              <option value="">Select a Building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.building_name}
                </option>
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
        )}

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        {wallets.length > 0 && (
          <div className="wallet-section">
            <h3>Wallets in this Building</h3>
            <div className="wallet-table-wrapper">
              <table className="wallet-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Wallet Amount</th>
                    <th>Balance</th>
                    <th>Retainable</th>
                    <th>Expires At</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet, index) => {
                    const user = userMap[wallet.user_id] || {};
                    return (
                      <tr key={wallet.id}>
                        <td>{index + 1}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>₹{wallet.wallet_amount}</td>
                        <td>₹{wallet.balance_amount}</td>
                        <td>{wallet.is_retainable ? 'Yes' : 'No'}</td>
                        <td>
                          {wallet.expiry_at
                            ? new Date(wallet.expiry_at).toLocaleString()
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
