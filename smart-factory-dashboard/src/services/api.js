// src/services/api.js

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

console.log(
  "API Base URL:",
  API_BASE_URL,
  "Development:",
  process.env.NODE_ENV === "development"
);

// 탭별 고유 ID 가져오기
const getTabId = () => {
  let tabId = sessionStorage.getItem("tabId");
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("tabId", tabId);
  }
  return tabId;
};

// 공통 헤더 설정 (토큰 포함)
const getHeaders = () => {
  // 현재 탭의 사용자 확인
  const tabId = getTabId();
  const username = localStorage.getItem(`tab_${tabId}_username`);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (username) {
    const token = localStorage.getItem(`user_${username}_token`);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// 헬스 체크
export const checkHealth = async () => {
  try {
    console.log("헬스 체크 요청:", `${API_BASE_URL}/api/health`);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("헬스 체크 실패:", error);
    throw error;
  }
};

// 실시간 통계 조회
export const getRealtimeStatistics = async () => {
  try {
    console.log("통계 조회 요청:", `${API_BASE_URL}/api/statistics/latest`);
    const response = await fetch(`${API_BASE_URL}/api/statistics/latest`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("통계 조회 실패:", error);
    throw error;
  }
};

// 최근 측정 데이터 조회
export const getRecentMeasurements = async (limit = 100, itemName = null) => {
  try {
    let url = `${API_BASE_URL}/api/measurements/recent?limit=${limit}`;
    if (itemName) {
      url += `&itemName=${encodeURIComponent(itemName)}`;
    }

    console.log("측정 데이터 조회 요청:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("측정 데이터 조회 실패:", error);
    throw error;
  }
};

// 항목별 NG 통계 조회
export const getNgCountByItem = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics/ng-by-item`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("NG 통계 조회 실패:", error);
    throw error;
  }
};

// 명령 전송
export const sendCommand = async (command) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/commands`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("명령 전송 실패:", error);
    throw error;
  }
};

// ===== 임계값 설정 API 함수 =====

// 모든 임계값 조회
export const getAllThresholds = async () => {
  try {
    console.log("임계값 조회 요청:", `${API_BASE_URL}/api/thresholds`);
    const response = await fetch(`${API_BASE_URL}/api/thresholds`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("임계값 조회 실패:", error);
    throw error;
  }
};

// 특정 항목의 임계값 조회
export const getThreshold = async (itemName) => {
  try {
    console.log(
      "특정 임계값 조회:",
      `${API_BASE_URL}/api/thresholds/${itemName}`
    );
    const response = await fetch(`${API_BASE_URL}/api/thresholds/${itemName}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("특정 임계값 조회 실패:", error);
    throw error;
  }
};

// 임계값 업데이트
export const updateThreshold = async (
  itemName,
  upperLimit,
  lowerLimit,
  updatedBy = "admin"
) => {
  try {
    console.log(
      `임계값 업데이트 요청: ${itemName} - 상한:${upperLimit}, 하한:${lowerLimit}`
    );
    const response = await fetch(`${API_BASE_URL}/api/thresholds/${itemName}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        upperLimit: parseFloat(upperLimit),
        lowerLimit: parseFloat(lowerLimit),
        updatedBy: updatedBy,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("임계값 업데이트 실패:", error);
    throw error;
  }
};

// 여러 임계값 일괄 업데이트
export const updateThresholdsBatch = async (
  thresholds,
  updatedBy = "admin"
) => {
  try {
    console.log("임계값 일괄 업데이트 요청:", thresholds.length, "개");
    const response = await fetch(`${API_BASE_URL}/api/thresholds/batch`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(
        thresholds.map((t) => ({
          itemName: t.itemName,
          upperLimit: parseFloat(t.upperLimit),
          lowerLimit: parseFloat(t.lowerLimit),
          updatedBy: updatedBy,
        }))
      ),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("임계값 일괄 업데이트 실패:", error);
    throw error;
  }
};

// 특정 항목의 시계열 측정 데이터 조회 (NG 항목 차트용)
export const getMeasurementTimeSeries = async (itemName, limit = 20) => {
  try {
    console.log(`시계열 데이터 조회 요청: ${itemName}, limit: ${limit}`);

    const url = `${API_BASE_URL}/api/measurements/timeseries?itemName=${encodeURIComponent(
      itemName
    )}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`시계열 데이터 조회 성공: ${data.length}개`);
    return data;
  } catch (error) {
    console.error("시계열 데이터 조회 실패:", error);
    throw error;
  }
};

// 네트워크 상태 체크
export const checkNetworkConnection = async () => {
  try {
    console.log("네트워크 연결 테스트 시작...");

    // 서버 헬스 체크
    const health = await checkHealth();
    console.log("서버 상태:", health);

    // 통계 데이터 테스트
    const stats = await getRealtimeStatistics();
    console.log("통계 데이터:", stats);

    return {
      success: true,
      message: "네트워크 연결 성공",
      serverStatus: health.status,
      statistics: stats,
    };
  } catch (error) {
    console.error("네트워크 연결 실패:", error);
    return {
      success: false,
      message: error.message,
      error: error.toString(),
    };
  }
};
