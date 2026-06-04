// components/AuthContex/B2CContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const B2CAuthContext = createContext();

export const B2CAuthProvider = ({ children }) => {
  const [b2cUser, setB2cUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("b2c_token") || null);

  // ✅ Sync with localStorage on load
  useEffect(() => {
    if (token && !b2cUser) {
      try {
        const stored = localStorage.getItem("b2c_info");
        if (stored) {
          setB2cUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load B2C info", e);
      }
    }
  }, [token, b2cUser]);

  const login = (userData, accessToken) => {
    setB2cUser(userData);
    setToken(accessToken);
    localStorage.setItem("b2c_token", accessToken);
    localStorage.setItem("b2c_info", JSON.stringify(userData));
  };

  const logout = () => {
    setB2cUser(null);
    setToken(null);
    localStorage.removeItem("b2c_token");
    localStorage.removeItem("b2c_info");
  };

  return (
    <B2CAuthContext.Provider value={{ b2cUser, token, login, logout }}>
      {children}
    </B2CAuthContext.Provider>
  );
};

export const useB2CAuth = () => useContext(B2CAuthContext);
