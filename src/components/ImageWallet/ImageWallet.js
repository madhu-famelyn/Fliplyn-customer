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
//           `https://admin-aged-field-2794.fly.dev/buildings/buildings/by-admin/${adminId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const buildingId = buildingRes.data.id;

//         const walletRes = await axios.get(
//           `https://admin-aged-field-2794.fly.dev/wallets/by-building/${buildingId}/images`,
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
