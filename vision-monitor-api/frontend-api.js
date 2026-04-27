// Mock 데이터 생성 함수
export const generateMockData = () => {
  const measurements = [];
  const items = ["ITEM-001", "ITEM-002", "ITEM-003", "ITEM-004", "ITEM-005"];
  const measurementNames = [
    "vertical_upper_diameter_avg",
    "vertical_lower_diameter_1",
    "vertical_lower_diameter_2",
    "vertical_left_length_1",
    "vertical_left_length_2",
    "vertical_right_length_1",
    "vertical_right_length_2",
    "vertical_left_roundness_1",
    "vertical_left_roundness_2",
    "vertical_right_roundness_1",
    "vertical_right_roundness_2",
    "vertical_left_angle_1",
    "vertical_left_angle_2",
    "vertical_right_angle_1",
    "vertical_right_angle_2",
  ];

  for (let i = 0; i < 100; i++) {
    const isOK = Math.random() > 0.15; // 85% 수율
    const selectedMeasurement =
      measurementNames[Math.floor(Math.random() * measurementNames.length)];

    // 측정 항목별 적절한 값 범위 설정
    let measurementValue;
    if (selectedMeasurement.includes("diameter")) {
      measurementValue = isOK ? 95 + Math.random() * 8 : 85 + Math.random() * 5;
    } else if (selectedMeasurement.includes("length")) {
      measurementValue = isOK
        ? 115 + Math.random() * 8
        : 105 + Math.random() * 5;
    } else if (selectedMeasurement.includes("roundness")) {
      measurementValue = isOK ? 0 + Math.random() * 4 : 5 + Math.random() * 2;
    } else if (selectedMeasurement.includes("angle")) {
      measurementValue = isOK ? 85 + Math.random() * 8 : 75 + Math.random() * 5;
    } else {
      measurementValue = isOK
        ? 100 + Math.random() * 10
        : 90 + Math.random() * 5;
    }

    measurements.push({
      id: i,
      measureTime: new Date(Date.now() - i * 60000).toISOString(),
      itemName: items[Math.floor(Math.random() * items.length)],
      measurementName: selectedMeasurement,
      measurementValue: measurementValue,
      result: isOK ? "OK" : "NG",
    });
  }

  return measurements;
};

// Spring Boot API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// 실제 API 호출 함수들
export const getRealtimeStatistics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('통계 조회 실패:', error);
    // 실패 시 Mock 데이터 반환
    return {
      totalCount: 47234,
      yieldRate: 96.8,
      machineStatus: "RUNNING",
    };
  }
};

export const getRecentMeasurements = async (limit = 100) => {
  try {
    const response = await fetch(`${API_BASE_URL}/measurements/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('측정 데이터 조회 실패:', error);
    // 실패 시 Mock 데이터 반환
    return generateMockData();
  }
};

export const getNgCountByItem = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics/ng-by-item`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('NG 통계 조회 실패:', error);
    // 실패 시 Mock 데이터 반환
    return {
      UPPER_DIAMETER_AVG: 12,
      LOWER_DIAMETER_1: 8,
      LOWER_DIAMETER_2: 7,
      LEFT_LENGTH_1: 10,
      LEFT_LENGTH_2: 9,
      RIGHT_LENGTH_1: 11,
      RIGHT_LENGTH_2: 8,
      LEFT_ROUNDNESS_1: 15,
      LEFT_ROUNDNESS_2: 14,
      RIGHT_ROUNDNESS_1: 13,
      RIGHT_ROUNDNESS_2: 12,
      LEFT_ANGLE_1: 6,
      LEFT_ANGLE_2: 7,
      RIGHT_ANGLE_1: 5,
      RIGHT_ANGLE_2: 6,
    };
  }
};

export const sendCommand = async (commandType, parameters) => {
  try {
    const response = await fetch(`${API_BASE_URL}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandType, parameters })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('명령 전송 실패:', error);
    return { success: false, message: error.message };
  }
};
