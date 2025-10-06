import axios from "axios";

// ✅ Use Vite environment variable
const API_BASE = 'https://admin-aged-field-2794.fly.dev';


/**
 * @param {Object} data - Form data
 * @param {string} token - Bearer token
 * @returns Axios response
 */
export const uploadWalletGroupExcel = (data, token) => {
  return axios.post(`${API_BASE}/wallet-group/supload-excel/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};



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



export const addMemberToWalletGroup = (groupId, name, email, mobileNumber, token) => {
  return axios.post(
    `${API_BASE}/wallet-group/add-member`,
    { group_id: groupId, name, email, mobile_number: mobileNumber },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};





export const updateUserStatus = (groupId, userId, isActive, token) => {
  return axios.put(
    `${API_BASE}/wallet-group/${groupId}/update-user-status`,
    { user_id: userId, is_active: isActive },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};




export const getOrdersByUserIds = async (userIds, token) => {
  const responses = await Promise.all(
    userIds.map(async (id) => {
      const res = await fetch(`https://admin-aged-field-2794.fly.dev/orders/user/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) return []; // no orders for this user
        throw new Error(`Failed to fetch orders for ${id}, status: ${res.status}`);
      }

      return res.json();
    })
  );

  return responses.flat();
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