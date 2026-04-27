// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(username, password);

      if (response.token) {
        // 토큰 및 사용자 정보 저장
        localStorage.setItem("token", response.token);
        localStorage.setItem("username", response.username);
        localStorage.setItem("role", response.role);
        localStorage.setItem("fullName", response.fullName);

        console.log("로그인 성공:", response);

        // 대시보드로 이동
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("로그인 실패:", err);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Vision Monitor</h1>
          <p>Smart Factory Quality Control System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">사용자 ID</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="login-footer">
          <div className="demo-accounts">
            <p className="demo-title">테스트 계정</p>
            <div className="demo-account">
              <span className="demo-label">관리자:</span>
              <span className="demo-value">admin / 1234</span>
            </div>
            <div className="demo-account">
              <span className="demo-label">생산자:</span>
              <span className="demo-value">producer1 / 1234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
