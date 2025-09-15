import axios from "axios";

// ✅ Use Vite environment variable
const API_BASE = import.meta.env.VITE_API_URL;

/**
 * Upload Wallet Group Excel
 * @param {Object} data - Form data
 * @param {string} token - Bearer token
 * @returns Axios response
 */
export const uploadWalletGroupExcel = (data, token) => {
  return axios.post(`${API_BASE}/wallet-group/upload-excel/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};



// ✅ Fetch wallet groups by HR ID
export const getWalletGroupsByHrId = async (hrId, token) => {
  try {
    const response = await axios.get(`${API_BASE}/hr/get-wallet/${hrId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Failed to fetch wallet groups:", error);
    return [];
  }
};

// ✅ Add a member manually to a wallet group
export const addMemberToWalletGroup = (groupId, name, email, mobileNumber, token) => {
  return axios.post(
    `${API_BASE}/wallet-group/add-member`,
    { group_id: groupId, name, email, mobile_number: mobileNumber },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};





// ✅ Update a user's active status
export const updateUserStatus = (groupId, userId, isActive, token) => {
  return axios.put(
    `${API_BASE}/wallet-group/${groupId}/update-user-status`,
    { user_id: userId, is_active: isActive },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};




export const getOrdersByUserIds = async (userIds, token) => {
  try {
    let allOrders = [];
    for (const userId of userIds) {
      const res = await axios.get(`${API_BASE}/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      allOrders = [...allOrders, ...res.data];
    }
    // sort latest first
    allOrders.sort(
      (a, b) => new Date(b.created_datetime) - new Date(a.created_datetime)
    );
    return allOrders;
  } catch (error) {
    console.error("❌ Failed to fetch orders:", error);
    return [];
  }
};




// ✅ Upload Excel to update a wallet group
export const uploadWalletGroupExcel1 = async (groupId, file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.put(
      `${API_BASE}/wallet-groups/${groupId}/upload-excel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Failed to upload Excel:", err);
    throw err;
  }
};