// StallService.js

// Service.js
export const fetchBuildings = async (adminId, token) => {
  console.log("📡 Calling fetchBuildings with adminId:", adminId);
  const res = await fetch(`https://fliplyn.onrender.com/buildings/buildings/by-admin/${adminId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Backend responded with error:', errorText);
    throw new Error('Failed to fetch buildings');
  }

  return res.json();
};



// src/pages/stalls/Service.js

export const createStall = async (stallData, token) => {
  const formData = new FormData();
  formData.append('name', stallData.name);
  formData.append('description', stallData.description);
  formData.append('building_id', stallData.building_id);
  formData.append('admin_id', stallData.user_id); // ✅ always admin_id for now
  formData.append('file', stallData.file);

  const res = await fetch(`https://fliplyn.onrender.com/stalls/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
      // ✅ Do NOT set Content-Type manually for FormData
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text(); // log server error
    console.error("Stall create error response:", errorText);
    throw new Error('Failed to create stall');
  }

  return res.json();
};



export const fetchStallsByBuilding = async (buildingId, token) => {
  const res = await fetch(`https://fliplyn.onrender.com/stalls/building/${buildingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Failed to fetch stalls');
  return res.json();
};



export const updateStall = async (stallId, stallData, token) => {
  const formData = new FormData();
  if (stallData.name) formData.append('name', stallData.name);
  if (stallData.description) formData.append('description', stallData.description);
  if (stallData.file) formData.append('file', stallData.file);
  if (stallData.admin_id) formData.append('admin_id', stallData.admin_id);

  const res = await fetch(`https://fliplyn.onrender.com/stalls/${stallId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Stall update failed:', errorText);
    throw new Error('Failed to update stall');
  }

  return res.json();
};
