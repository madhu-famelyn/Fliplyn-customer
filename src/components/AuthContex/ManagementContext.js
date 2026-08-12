import React, { createContext, useContext, useState } from "react";

const ManagementAuthContext = createContext();

export const ManagementAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("mgmtToken") || localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const storedMgmt = localStorage.getItem("mgmtUser");
      if (storedMgmt) return JSON.parse(storedMgmt);
      const storedUser = localStorage.getItem("user");
      if (storedUser) return JSON.parse(storedUser);
      return null;
    } catch {
      return null;
    }
  });

  const login = (jwt, userData) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem("mgmtToken", jwt);
    localStorage.setItem("mgmtUser", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mgmtToken");
    localStorage.removeItem("mgmtUser");
  };

  return (
    <ManagementAuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </ManagementAuthContext.Provider>
  );
};

export const useManagementAuth = () => useContext(ManagementAuthContext);
