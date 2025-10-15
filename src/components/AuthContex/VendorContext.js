import React, { createContext, useContext, useState } from "react";

const VendorAuthContext = createContext(null);

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }
  return context;
};

export const VendorAuthProvider = ({ children }) => {
  // ✅ Always provide a default value for children
  if (!children) {
    console.warn("⚠️ VendorAuthProvider rendered without children.");
  }

  const [token, setToken] = useState(localStorage.getItem("vendorToken") || null);
  const [vendorId, setVendorId] = useState(localStorage.getItem("vendorId") || null);
  const [role, setRole] = useState(localStorage.getItem("vendorRole") || null);
  const [vendorPhone, setVendorPhone] = useState(localStorage.getItem("vendorPhone") || null);
  const [stallIds, setStallIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stallIds")) || [];
    } catch {
      return [];
    }
  });
  const [vendorName, setVendorName] = useState(localStorage.getItem("vendorName") || null);

  const loginUser = (token, vendorId, role, vendorPhone, stallIds, vendorName) => {
    setToken(token);
    setVendorId(vendorId);
    setRole(role);
    setVendorPhone(vendorPhone);
    setStallIds(stallIds);
    setVendorName(vendorName);

    localStorage.setItem("vendorToken", token);
    localStorage.setItem("vendorId", vendorId);
    localStorage.setItem("vendorRole", role);
    localStorage.setItem("vendorPhone", vendorPhone);
    localStorage.setItem("stallIds", JSON.stringify(stallIds));
    localStorage.setItem("vendorName", vendorName);
  };

  const logoutUser = () => {
    setToken(null);
    setVendorId(null);
    setRole(null);
    setVendorPhone(null);
    setStallIds([]);
    setVendorName(null);

    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("vendorRole");
    localStorage.removeItem("vendorPhone");
    localStorage.removeItem("stallIds");
    localStorage.removeItem("vendorName");
  };

  const contextValue = {
    token,
    vendorId,
    role,
    vendorPhone,
    stallIds,
    vendorName,
    loginUser,
    logoutUser,
  };

  return (
    <VendorAuthContext.Provider value={contextValue}>
      {children}
    </VendorAuthContext.Provider>
  );
};
