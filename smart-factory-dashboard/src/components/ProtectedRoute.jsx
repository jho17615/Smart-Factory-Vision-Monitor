// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
