// src/AuthContex/ContextAPI.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null); // vendor_id
  const [role, setRole] = useState(null);
  const [phone, setPhone] = useState(null);
  const [stallId, setStallId] = useState(null);
  const [vendorName, setVendorName] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");
    const storedPhone = localStorage.getItem("phone");
    const storedStallId = localStorage.getItem("stallId");
    const storedVendorName = localStorage.getItem("vendorName");

    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);

      if (storedPhone) setPhone(storedPhone);
      if (storedStallId) setStallId(storedStallId);
      if (storedVendorName) setVendorName(storedVendorName);
    }
  }, []);

  // ✅ Adjusted to handle vendorId, phone, stallId, vendorName
  const loginUser = (jwt, id, userRole, userPhone = null, userStallId = null, name = null) => {
    setToken(jwt);
    setUserId(id);
    setRole(userRole);

    if (userPhone) {
      setPhone(userPhone);
      localStorage.setItem("phone", userPhone);
    }

    if (userStallId) {
      setStallId(userStallId);
      localStorage.setItem("stallId", userStallId);
    }

    if (name) {
      setVendorName(name);
      localStorage.setItem("vendorName", name);
    }

    localStorage.setItem("token", jwt);
    localStorage.setItem("userId", id);
    localStorage.setItem("role", userRole);
  };

  const logoutUser = () => {
    setToken(null);
    setUserId(null);
    setRole(null);
    setPhone(null);
    setStallId(null);
    setVendorName(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,      // vendor_id
        role,
        phone,
        stallId,
        vendorName,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



























// // src/AuthContex/ContextAPI.js

// import React, { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(null);
//   const [email, setEmail] = useState(null);
//   const [userId, setUserId] = useState(null);
//   const [role, setRole] = useState(null); // admin or vendor
//   const [phone, setPhone] = useState(null); // vendor specific

//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     const storedEmail = localStorage.getItem("email");
//     const storedUserId = localStorage.getItem("userId");
//     const storedRole = localStorage.getItem("role");
//     const storedPhone = localStorage.getItem("phone");

//     if (storedToken && storedUserId && storedRole) {
//       setToken(storedToken);
//       setUserId(storedUserId);
//       setRole(storedRole);

//       if (storedEmail) setEmail(storedEmail);
//       if (storedPhone) setPhone(storedPhone);
//     }
//   }, []);

//   // Handles both admin & vendor
//   const loginUser = (jwt, userEmail, id, userRole, userPhone = null) => {
//     setToken(jwt);
//     setUserId(id);
//     setRole(userRole);

//     if (userEmail) {
//       setEmail(userEmail);
//       localStorage.setItem("email", userEmail);
//     }

//     if (userPhone) {
//       setPhone(userPhone);
//       localStorage.setItem("phone", userPhone);
//     }

//     localStorage.setItem("token", jwt);
//     localStorage.setItem("userId", id);
//     localStorage.setItem("role", userRole);
//   };

//   const logoutUser = () => {
//     setToken(null);
//     setEmail(null);
//     setUserId(null);
//     setRole(null);
//     setPhone(null);

//     localStorage.clear();
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         token,
//         email,
//         userId,
//         role,
//         phone,
//         loginUser,
//         logoutUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
