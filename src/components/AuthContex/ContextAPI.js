import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); 
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedToken && storedUser && storedRole) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
  }, []);

  const loginUser = (jwt, userData, userRole) => {
    setToken(jwt);
    setUser(userData);
    setRole(userRole);

    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", userRole);
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user, // full manager details
        role,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);