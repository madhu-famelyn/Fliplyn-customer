// // src/services/walletService.js
// import axios from "axios";
// import { useAuth } from "../AuthContex/ContextAPI";
// import { useState, useEffect } from "react";

// export const useAdminWallets = () => { // lowercase 'u' for hook
//   const { adminId, token } = useAuth();
//   const [wallets, setWallets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!adminId || !token) {
//       setLoading(false);
//       return;
//     }

//     const fetchWallets = async () => {
//       try {
//         const buildingRes = await axios.get(
//           `http://127.0.0.1:8000/buildings/buildings/by-admin/${adminId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const buildingId = buildingRes.data.id;

//         const walletRes = await axios.get(
//           `http://127.0.0.1:8000/wallets/by-building/${buildingId}/images`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         setWallets(walletRes.data || []);
//       } catch (err) {
//         console.error("❌ Error fetching wallets:", err.response?.data || err.message);
//         setError(err.response?.data?.detail || "Failed to fetch wallets");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchWallets();
//   }, [adminId, token]);

//   return { wallets, loading, error };
// };
