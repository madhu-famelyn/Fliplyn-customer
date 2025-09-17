// src/AuthContex/ContextAPI.js

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminId, setAdminId] = useState(null); // ✅ added
  const [role, setRole] = useState(null); // admin or vendor
  const [phone, setPhone] = useState(null); // vendor specific

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("email");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");
    const storedPhone = localStorage.getItem("phone");
    const storedAdminId = localStorage.getItem("adminId"); // ✅ added

    if (storedToken) setToken(storedToken);
    if (storedUserId) setUserId(storedUserId);
    if (storedRole) setRole(storedRole);
    if (storedEmail) setEmail(storedEmail);
    if (storedPhone) setPhone(storedPhone);
    if (storedAdminId) setAdminId(storedAdminId); // ✅ added
  }, []);

  // Handles both admin & vendor
  const loginUser = (jwt, userEmail, id, userRole, userPhone = null) => {
    setToken(jwt);
    setUserId(id);
    setRole(userRole);

    if (userEmail) {
      setEmail(userEmail);
      localStorage.setItem("email", userEmail);
    }

    if (userPhone) {
      setPhone(userPhone);
      localStorage.setItem("phone", userPhone);
    }

    localStorage.setItem("token", jwt);
    localStorage.setItem("userId", id);
    localStorage.setItem("role", userRole);

    if (userRole === "admin") {
      setAdminId(id);
      localStorage.setItem("adminId", id); // ✅ store adminId
    }
  };

  const logoutUser = () => {
    setToken(null);
    setEmail(null);
    setUserId(null);
    setAdminId(null); // ✅ clear adminId
    setRole(null);
    setPhone(null);

    // clear only auth values
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
    localStorage.removeItem("role");
    localStorage.removeItem("phone");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        userId,
        adminId, // ✅ now available
        role,
        phone,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
