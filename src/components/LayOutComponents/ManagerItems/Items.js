import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContex/ContextAPI';
import {
  fetchManagerById,
  fetchStallsByBuilding,
  fetchItemsByStallId,
} from './Service';
import AdminLayout from '../../LayOut/AdminLayout';
import './Items.css';

export default function ItemDetails() {
  const { userId, token, role } = useAuth();

  const [manager, setManager] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (userId && role === 'manager') {
      fetchManagerById(userId, token)
        .then((managerData) => {
          setManager(managerData);
          return fetchStallsByBuilding(managerData.building_id, token);
        })
        .then((stallList) => {
          setStalls(stallList);
          // fetch all items from all stalls initially
          return Promise.all(
            stallList.map((stall) => fetchItemsByStallId(stall.id, token))
          );
        })
        .then((allItemsLists) => {
          const mergedItems = allItemsLists.flat();
          setItems(mergedItems);
        })
        .catch((err) => console.error('Error fetching data:', err));
    }
  }, [userId, token, role]);

  const handleStallChange = async (e) => {
    const selectedId = e.target.value;
    setSelectedStallId(selectedId);

    if (selectedId === '') {
      // Show all items
      const allItems = await Promise.all(
        stalls.map((stall) => fetchItemsByStallId(stall.id, token))
      );
      setItems(allItems.flat());
    } else {
      const items = await fetchItemsByStallId(selectedId, token);
      setItems(items);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Item Listings</h2>

      {stalls.length > 0 && (
        <div className="mb-6">
          <label className="block mb-1 font-medium">Filter by Stall:</label>
          <select
            value={selectedStallId}
            onChange={handleStallChange}
            className="w-full p-2 border rounded"
          >
            <option value="">All Stalls</option>
            {stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded p-4 shadow hover:shadow-lg transition"
            >
              <img
                src={`https://fliplyn.onrender.com/${item.image_url}`}
                alt={item.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="mt-2 text-green-700 font-bold">₹ {item.final_price}</p>
              <p className="text-xs text-gray-500">
                Tax Included: {item.tax_included ? 'Yes' : 'No'} | GST: {item.Gst_precentage}%
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No items found.</p>
      )}
    </div>
  );
}
