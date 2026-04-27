// src/services/auth.js

// 환경별 API 주소 설정
const getApiBaseUrl = () => {
  // 프로덕션 환경 (Nginx 프록시 사용)
  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return ""; // Nginx 프록시가 /api를 backend:8081로 전달
  }

  // 로컬 개발 환경
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8081";
  }

  // 로컬 네트워크 (모바일 테스트)
  return `http://${hostname}:8081`;
};

const API_BASE_URL = getApiBaseUrl();

// 탭별 고유 ID (세션별 구분용)
const getTabId = () => {
  let tabId = sessionStorage.getItem("tabId");
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("tabId", tabId);
  }
  return tabId;
};

/**
 * 로그인
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "로그인 실패");
    }

    const data = await response.json();

    // 현재 탭에 사용자 매핑 저장
    const tabId = getTabId();
    sessionStorage.setItem("current_username", data.username);
    localStorage.setItem(`tab_${tabId}_username`, data.username);

    // 사용자별 키로 저장 (같은 계정이면 PC/모바일 공유)
    localStorage.setItem(`user_${data.username}_token`, data.token);
    localStorage.setItem(`user_${data.username}_username`, data.username);
    localStorage.setItem(`user_${data.username}_role`, data.role);
    localStorage.setItem(`user_${data.username}_fullName`, data.fullName);

    return data;
  } catch (error) {
    console.error("로그인 에러:", error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const logout = () => {
  const tabId = getTabId();
  const username = localStorage.getItem(`tab_${tabId}_username`);

  // 현재 탭의 매핑만 제거 (다른 탭은 유지)
  sessionStorage.removeItem("current_username");
  localStorage.removeItem(`tab_${tabId}_username`);

  // 사용자 데이터는 유지 (다른 탭/기기에서 사용 중일 수 있음)
  window.location.href = "/login";
};

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("사용자 정보 조회 실패");
    }

    return await response.json();
  } catch (error) {
    console.error("사용자 정보 조회 에러:", error);
    logout();
    return null;
  }
};

/**
 * 토큰 가져오기
 */
export const getToken = () => {
  const tabId = getTabId();
  const username = localStorage.getItem(`tab_${tabId}_username`);
  if (!username) return null;
  return localStorage.getItem(`user_${username}_token`);
};

/**
 * 사용자 역할 가져오기
 */
export const getUserRole = () => {
  const tabId = getTabId();
  const username = localStorage.getItem(`tab_${tabId}_username`);
  if (!username) return null;
  return localStorage.getItem(`user_${username}_role`);
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = () => {
  return getUserRole() === "ROLE_ADMIN";
};

/**
 * 생산자 여부 확인
 */
export const isProducer = () => {
  return getUserRole() === "ROLE_PRODUCER";
};

/**
 * 인증 여부 확인
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * 사용자 정보 가져오기
 */
export const getUserInfo = () => {
  const tabId = getTabId();
  const username = localStorage.getItem(`tab_${tabId}_username`);
  if (!username) return null;

  return {
    username: localStorage.getItem(`user_${username}_username`),
    role: localStorage.getItem(`user_${username}_role`),
    fullName: localStorage.getItem(`user_${username}_fullName`),
  };
};
