import React from "react";
import Sidebar from "./SideBar";
import "./SideBar.css";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
