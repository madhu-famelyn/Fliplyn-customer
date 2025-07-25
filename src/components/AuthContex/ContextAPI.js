


import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null); // 👈 track admin or manager

  // 🔁 Restore from localStorage on first render
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUserId && storedEmail && storedRole) {
      setToken(storedToken);
      setEmail(storedEmail);
      setUserId(storedUserId);
      setRole(storedRole);
    }
  }, []);

  const loginUser = (jwt, userEmail, id, userRole) => {
    setToken(jwt);
    setEmail(userEmail);
    setUserId(id);
    setRole(userRole);

    localStorage.setItem('token', jwt);
    localStorage.setItem('email', userEmail);
    localStorage.setItem('userId', id);
    localStorage.setItem('role', userRole);
  };

  const logoutUser = () => {
    setToken(null);
    setEmail(null);
    setUserId(null);
    setRole(null);

    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        userId,
        role,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
