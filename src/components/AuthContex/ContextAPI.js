// src/AuthContex/ContextAPI.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null); // vendor_id
  const [role, setRole] = useState(null);
  const [phone, setPhone] = useState(null);
  const [stallIds, setStallIds] = useState([]); // ✅ multiple stalls
  const [vendorName, setVendorName] = useState(null);

  // ✅ NEW: Track which stall vendor selected
  const [selectedStallId, setSelectedStallId] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role");
    const storedPhone = localStorage.getItem("phone");
    const storedStallIds = localStorage.getItem("stallIds");
    const storedVendorName = localStorage.getItem("vendorName");
    const storedSelectedStallId = localStorage.getItem("selectedStallId");

    if (storedToken && storedUserId && storedRole) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);

      if (storedPhone) setPhone(storedPhone);
      if (storedStallIds) setStallIds(JSON.parse(storedStallIds)); // ✅ parse JSON array
      if (storedVendorName) setVendorName(storedVendorName);
      if (storedSelectedStallId) setSelectedStallId(storedSelectedStallId);
    }
  }, []);

  // ✅ Adjusted to handle multiple stallIds
  const loginUser = (
    jwt,
    id,
    userRole,
    userPhone = null,
    userStallIds = [], // now array
    name = null
  ) => {
    setToken(jwt);
    setUserId(id);
    setRole(userRole);

    if (userPhone) {
      setPhone(userPhone);
      localStorage.setItem("phone", userPhone);
    }

    if (userStallIds?.length > 0) {
      setStallIds(userStallIds);
      localStorage.setItem("stallIds", JSON.stringify(userStallIds));
    }

    if (name) {
      setVendorName(name);
      localStorage.setItem("vendorName", name);
    }

    localStorage.setItem("token", jwt);
    localStorage.setItem("userId", id);
    localStorage.setItem("role", userRole);
  };

  // ✅ NEW: Set selected stall
  const setStallId = (id) => {
    setSelectedStallId(id);
    localStorage.setItem("selectedStallId", id);
  };

  const logoutUser = () => {
    setToken(null);
    setUserId(null);
    setRole(null);
    setPhone(null);
    setStallIds([]);
    setVendorName(null);
    setSelectedStallId(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId, // vendor_id
        role,
        phone,
        stallIds, // ✅ multiple stalls available
        vendorName,
        selectedStallId, // ✅ currently chosen stall
        setStallId, // ✅ function exposed
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
