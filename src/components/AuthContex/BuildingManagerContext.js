// src/AuthContex/BuildingManagerContext.js
import  { createContext, useContext, useState } from "react";

const BuildingManagerContext = createContext();

export const BuildingManagerProvider = ({ children }) => {
  const [manager, setManager] = useState(() => {
    const stored = localStorage.getItem("bm_manager");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("bm_token") || null);

  const login = (managerData, accessToken) => {
    setManager(managerData);
    setToken(accessToken);
    localStorage.setItem("bm_manager", JSON.stringify(managerData));
    localStorage.setItem("bm_token", accessToken);
  };

  const logout = () => {
    setManager(null);
    setToken(null);
    localStorage.removeItem("bm_manager");
    localStorage.removeItem("bm_token");
  };

  return (
    <BuildingManagerContext.Provider value={{ manager, token, login, logout }}>
      {children}
    </BuildingManagerContext.Provider>
  );
};

export const useBuildingManagerAuth = () => useContext(BuildingManagerContext);
