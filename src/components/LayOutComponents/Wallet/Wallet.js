import React, { useEffect, useState } from 'react';
import {
  addMoneyToWallet,
  fetchBuildings,
  fetchWalletsByBuilding,
} from './Service';
import { useAuth } from '../../AuthContex/ContextAPI';
import AdminLayout from '../../LayOut/AdminLayout';
import './Wallet.css';

export default function AddMoney() {
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [retainable, setRetainable] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [wallets, setWallets] = useState([]);

  const { token, userId } = useAuth();

  // Fetch buildings on mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await fetchBuildings(userId, token);
        setBuildings(response);
        if (response.length > 0) {
          setSelectedBuilding(response[0].id);
        }
      } catch (err) {
        console.error('Failed to load buildings:', err);
        setError('❌ Failed to fetch buildings');
      }
    };
    loadBuildings();
  }, [userId, token]);

  // Fetch wallets when building changes
  useEffect(() => {
    const loadWallets = async () => {
      if (!selectedBuilding) return;
      try {
        const response = await fetchWalletsByBuilding(selectedBuilding, token);
        setWallets(response);
      } catch (err) {
        console.error('Failed to fetch wallets:', err);
      }
    };
    loadWallets();
  }, [selectedBuilding, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      const payload = {
        identifier: identifier.trim(),
        wallet_amount: parseFloat(amount),
        is_retainable: retainable,
        building_id: selectedBuilding,
      };

      await addMoneyToWallet(payload, token);

      const buildingName = buildings.find((b) => b.id === selectedBuilding)?.name || 'N/A';

      setSuccess(`✅ ₹${amount} added successfully to wallet for "${buildingName}"`);
      setIdentifier('');
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.detail || '❌ Something went wrong.');
    }
  };

  return (
    <AdminLayout>
      <div className="add-money-container">
        <h2>Add Money to Wallet</h2>
        <form onSubmit={handleSubmit} className="add-money-form">
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

          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            required
          >
            <option value="" disabled>Select Building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          <button type="submit">Add Money</button>
        </form>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Wallet List Section */}
        {wallets.length > 0 && (
          <div className="wallet-list">
            <h4>Wallets in Selected Building:</h4>
            <ul>
              {wallets.map((wallet) => (
                <li key={wallet.id}>
                  <strong>ID:</strong> {wallet.id} | ₹{wallet.wallet_amount} | Retainable:{' '}
                  {wallet.is_retainable ? 'Yes' : 'No'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
