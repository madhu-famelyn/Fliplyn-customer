import axios from 'axios';

const BASE_URL = 'https://admin-aged-field-2794.fly.dev';

/**
 * 🔍 Get Manager by ID
 */
export const getManagerById = async (managerId, token) => {
  try {
    console.log('📥 Fetching manager with ID:', managerId);
    const res = await axios.get(`${BASE_URL}/managers/${managerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Manager fetched:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching manager:', error);
    throw error;
  }
};

/**
 * 🏢 Fetch stalls by building ID
 */
export const fetchStallsByBuilding = async (buildingId, token) => {
  try {
    console.log('📥 Fetching stalls for building:', buildingId);
    const res = await axios.get(`${BASE_URL}/stalls/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`✅ ${res.data.length} stall(s) fetched`);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching stalls:', error);
    throw error;
  }
};

/**
 * ➕ Create a new stall
 */
export const createStall = async (formData, token) => {
  try {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('building_id', formData.building_id);
    data.append('manager_id', formData.user_id); // 🧠 or use admin_id if admin flow
    data.append('file', formData.file);

    console.log('📤 Creating stall with data:', {
      name: formData.name,
      description: formData.description,
      building_id: formData.building_id,
      manager_id: formData.user_id,
      file: formData.file.name,
    });

    const res = await axios.post(`${BASE_URL}/stalls/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Stall created successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error creating stall:', error.response?.data || error.message);
    throw error;
  }
};
