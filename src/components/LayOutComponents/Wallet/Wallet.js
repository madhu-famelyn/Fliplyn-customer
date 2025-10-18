import { useState, useEffect, useCallback } from 'react';
import {
  addMoneyToWallet,
  fetchBuildingByAdminId,
  getAllWalletsByBuildingId
} from './Service'; // updated service import
import { useAuth } from '../../AuthContex/AdminContext';
import './Wallet.css';

export default function AddMoney() {
  const [showForm, setShowForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [retainable, setRetainable] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { token, userId } = useAuth();

  // ---------------------- Fetch Wallets ----------------------
  const loadWallets = useCallback(
    async (bId) => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        // ✅ Use new API that includes user info
        const walletsData = await getAllWalletsByBuildingId(bId, token);
        setWallets(walletsData);
      } catch (err) {
        console.error('❌ Error loading wallets:', err);
        setWallets([]);
        setError('Failed to load wallets.');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // ---------------------- Fetch Buildings ----------------------
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        const buildingsData = await fetchBuildingByAdminId(userId, token);
        if (buildingsData && buildingsData.length > 0) {
          setBuildings(buildingsData);
          const firstId = buildingsData[0].id;
          setBuildingId(firstId);
          await loadWallets(firstId);
        } else {
          setError('No buildings found for this admin.');
        }
      } catch (err) {
        console.error('❌ Error fetching buildings:', err);
        setError('Failed to fetch building data.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadBuildings();
  }, [userId, token, loadWallets]);

  // ---------------------- Form Handlers ----------------------
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
      setError('Please select a building.');
      return;
    }

    if (!identifier.trim() || !amount) {
      setError('Please enter both identifier and amount.');
      return;
    }

    try {
      setLoading(true);
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
      await loadWallets(buildingId);
    } catch (err) {
      console.error('❌ Error adding money:', err);
      setError(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- UI ----------------------
  return (
      <div className="addmoney-container">
        {/* Header */}
        <div className="addmoney-header">
          <h2>Add Money to Wallet</h2>
          <button
            type="button"
            className="addmoney-toggle-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close Form' : 'Open Form'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="addmoney-form">
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

            <div className="addmoney-checkbox">
              <input
                type="checkbox"
                id="retainable"
                checked={retainable}
                onChange={(e) => setRetainable(e.target.checked)}
              />
              <label htmlFor="retainable">Retainable</label>
            </div>

            <button type="submit" className="addmoney-submit-btn">
              Add Money
            </button>
          </form>
        )}

        {/* Alerts */}
        {success && <p className="addmoney-success">{success}</p>}
        {error && <p className="addmoney-error">{error}</p>}

        {/* Loader */}
        {loading && (
          <div className="addmoney-loader">
            <div className="addmoney-spinner"></div>
            <p>Loading wallet and user data...</p>
          </div>
        )}

        {/* Wallet Table */}
        {!loading && wallets.length > 0 && (
          <div className="addmoney-wallet-section">
            <h3>Wallets in this Building</h3>
            <div className="addmoney-table-wrapper">
              <table className="addmoney-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User ID</th>
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
                  {wallets.map((wallet, index) => (
                    <tr key={wallet.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {wallet.user?.id || '—'}
                      </td>
                      <td>{wallet.user?.name || 'Unknown'}</td>
                      <td>{wallet.user?.company_email || 'N/A'}</td>
                      <td>{wallet.user?.phone_number || 'N/A'}</td>
                      <td>₹{wallet.wallet_amount}</td>
                      <td>₹{wallet.balance_amount}</td>
                      <td>{wallet.is_retainable ? 'Yes' : 'No'}</td>
                      <td>
                        {wallet.expiry_at
                          ? new Date(wallet.expiry_at).toLocaleString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}
