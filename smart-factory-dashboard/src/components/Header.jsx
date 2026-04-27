// src/components/Header.jsx
import React from "react";
import { logout, getUserInfo, isAdmin } from "../services/auth";
import "./Header.css";

const Header = () => {
  const userInfo = getUserInfo();

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      logout();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">Vision Monitor Dashboard</h1>
        <span className="header-subtitle">실시간 품질 관리 시스템</span>
      </div>

      <div className="header-right">
        <div className="user-info">
          <div className="user-details">
            <span className="user-name">{userInfo.fullName}</span>
            <span className="user-role">
              {isAdmin() ? "👑 관리자" : "👤 생산자"}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
