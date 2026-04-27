// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import { isAuthenticated } from "./services/auth";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 로그인 페이지 */}
          <Route
            path="/login"
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

          {/* 대시보드 (보호된 라우트) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Header />
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 기본 경로 -> 로그인 or 대시보드 */}
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated() ? "/dashboard" : "/login"}
                replace
              />
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
