// components/AuthContex/HrContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const HrAuthContext = createContext();

export const HrAuthProvider = ({ children }) => {
  const [hr, setHr] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("hr_token") || null);

  // ✅ Sync with localStorage on load
  useEffect(() => {
    if (token && !hr) {
      try {
        const stored = localStorage.getItem("hr_info");
        if (stored) {
          setHr(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load HR info", e);
      }
    }
  }, [token, hr]);

  const login = (hrData, accessToken) => {
    setHr(hrData);
    setToken(accessToken);
    localStorage.setItem("hr_token", accessToken);
    localStorage.setItem("hr_info", JSON.stringify(hrData));
  };

  const logout = () => {
    setHr(null);
    setToken(null);
    localStorage.removeItem("hr_token");
    localStorage.removeItem("hr_info");
  };

  return (
    <HrAuthContext.Provider value={{ hr, token, login, logout }}>
      {children}
    </HrAuthContext.Provider>
  );
};

export const useHrAuth = () => useContext(HrAuthContext);
