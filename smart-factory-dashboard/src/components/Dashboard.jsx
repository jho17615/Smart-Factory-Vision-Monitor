import React, { useState, useEffect, useRef, useCallback } from "react";
import StatisticsCard from "./StatisticsCard";
import SimpleChart from "./SimpleChart";
import MeasurementTable from "./MeasurementTable";
import ControlPanel from "./ControlPanel";
import {
  getRealtimeStatistics,
  getRecentMeasurements,
  getNgCountByItem,
  getMeasurementTimeSeries,
  getThreshold,
} from "../services/api";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [measurements, setMeasurements] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("yield"); // "yield" or "measurement"
  const [chartXAxis, setChartXAxis] = useState("time"); // "time" or "row_index"
  const [chartThresholds, setChartThresholds] = useState({
    upper: 0,
    lower: 0,
  });
  const [statistics, setStatistics] = useState({
    totalCount: 0,
    okCount: 0,
    ngCount: 0,
    yieldRate: 0,
    machineStatus: "STOPPED",
  });
  const [ngData, setNgData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedControlItem, setSelectedControlItem] = useState(
    "vertical_upper_diameter" // ✅ 8개 항목 형식
  );
  const [selectedNgFilter, setSelectedNgFilter] = useState(null);
  const [isLoadingNgData, setIsLoadingNgData] = useState(false);

  const measurementTableRef = useRef(null);
  const isInitialMount = useRef(true);

  // 항목명을 보기 좋게 포맷팅
  const formatItemName = (itemName) => {
    return itemName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // 전체 데이터 로드 (초기 로드 및 새로고침)
  const loadData = useCallback(async () => {
    try {
      console.log("=== loadData 호출 ===", { selectedNgFilter });

      const stats = await getRealtimeStatistics();
      setStatistics(stats);

      // NG 통계 로드 (항목별 NG 현황용)
      const ngStats = await getNgCountByItem();
      setNgData(ngStats);

      setLastUpdate(new Date());
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  }, [selectedNgFilter]);

  // 측정 데이터만 별도로 로드하는 함수
  const loadMeasurements = useCallback(async (filter = null) => {
    try {
      console.log("=== loadMeasurements 호출 ===", { filter });

      if (filter) {
        // 필터가 있으면 해당 항목의 NG 데이터만 조회
        const filteredMeasurements = await getRecentMeasurements(100, filter);
        console.log("필터된 데이터 로드:", filteredMeasurements.length, "건");
        setMeasurements(filteredMeasurements);
      } else {
        // 필터가 없으면 전체 데이터 조회
        const allMeasurements = await getRecentMeasurements(100);
        console.log("전체 측정 데이터 로드:", allMeasurements.length, "건");
        setMeasurements(allMeasurements);
      }
    } catch (error) {
      console.error("측정 데이터 로드 실패:", error);
    }
  }, []);

  // NG 항목 클릭 시 해당 항목의 NG 데이터만 API에서 다시 조회
  const handleNgItemClick = async (itemName) => {
    // 이미 로딩 중이면 무시
    if (isLoadingNgData) {
      console.log("이미 로딩 중입니다. 클릭 무시.");
      return;
    }

    try {
      setIsLoadingNgData(true);

      // "Upper Diameter 1" → "vertical_upper_diameter_1"
      const formattedName =
        "vertical_" + itemName.toLowerCase().replace(/ /g, "_");

      console.log("=== NG 항목 클릭 (시작) ===");
      console.log("클릭한 항목:", itemName, "→", formattedName);

      // ✅ ControlPanel용 매핑: _1, _2, _avg 제거하여 8개 항목 형식으로 변환
      let controlPanelItem = formattedName;

      // _1, _2, _avg 제거 (예: vertical_left_length_2 → vertical_left_length)
      controlPanelItem = controlPanelItem.replace(/_1$|_2$|_avg$/, "");

      console.log("ControlPanel 항목:", controlPanelItem);

      // 이미 동일한 필터가 선택되어 있다면 전체 보기로 전환
      if (selectedNgFilter === formattedName) {
        console.log("동일한 필터 선택됨 → 전체 보기로 전환");

        // 상태 업데이트
        setSelectedNgFilter(null);
        setSelectedControlItem("vertical_upper_diameter"); // ✅ 8개 항목 형식
        setChartMode("yield"); // 수율 모드로 복원
        setChartXAxis("time"); // X축 기준 리셋

        // 전체 데이터 로드
        await loadMeasurements(null);

        // 수율 차트로 복원
        initializeYieldChart();
      } else {
        // 새로운 필터 적용
        setSelectedNgFilter(formattedName); // NG 필터는 원본 사용 (_2, _avg 그대로)
        setSelectedControlItem(controlPanelItem); // ControlPanel은 _1로 매핑
        setChartXAxis("time"); // X축 기준 초기화 (시간순으로 시작)

        // 해당 항목의 NG 데이터만 조회
        await loadMeasurements(formattedName);

        // ✅ 차트를 측정값 모드로 전환하고 시계열 데이터 로드
        await loadMeasurementChart(formattedName);
      }

      console.log("=== NG 항목 클릭 (완료) ===");

      // 모바일에서 테이블로 스크롤
      if (measurementTableRef.current && window.innerWidth <= 968) {
        setTimeout(() => {
          measurementTableRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    } catch (error) {
      console.error("NG 데이터 조회 실패:", error);
    } finally {
      setIsLoadingNgData(false);
    }
  };

  // 전체 보기 (필터 해제)
  const handleResetFilter = async () => {
    setSelectedNgFilter(null);
    setSelectedControlItem("vertical_upper_diameter");
    setChartMode("yield"); // 수율 모드로 복원
    setChartXAxis("time"); // X축 기준 리셋
    // 전체 데이터 다시 로드
    await loadMeasurements(null);

    // 수율 차트로 복원
    initializeYieldChart();

    console.log("전체 보기 - 필터 해제됨");
  };

  // ✅ 측정값 차트 데이터 로드
  const loadMeasurementChart = async (itemName, xAxisType = chartXAxis) => {
    try {
      console.log(`=== 측정값 차트 로드: ${itemName}, X축: ${xAxisType} ===`);

      // 시계열 데이터 조회
      const timeSeriesData = await getMeasurementTimeSeries(itemName, 20);

      if (timeSeriesData && timeSeriesData.length > 0) {
        // 임계값 조회 (8개 항목 형식으로 변환)
        const baseItemName = itemName.replace(/_1$|_2$|_avg$/, "");
        const thresholdData = await getThreshold(baseItemName);

        // 차트 데이터 포맷팅 - X축 기준에 따라 다르게 처리
        const formattedChartData = timeSeriesData.map((item) => {
          const baseData = {
            measurementValue: item.measurementValue,
            upperLimit: thresholdData
              ? parseFloat(thresholdData.upperLimit)
              : 0,
            lowerLimit: thresholdData
              ? parseFloat(thresholdData.lowerLimit)
              : 0,
            rowIndex: item.rowIndex, // 제품번호용
            createdAt: item.createdAt, // 시간용
          };

          // X축 기준에 따라 라벨 설정
          if (xAxisType === "time") {
            baseData.time = new Date(item.createdAt).toLocaleTimeString(
              "ko-KR",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
          } else {
            baseData.time = `#${item.rowIndex}`; // 제품번호
          }

          return baseData;
        });

        console.log(`차트 데이터 샘플:`, formattedChartData[0]);

        setChartData(formattedChartData);
        setChartMode("measurement");
        setChartThresholds({
          upper: thresholdData ? parseFloat(thresholdData.upperLimit) : 0,
          lower: thresholdData ? parseFloat(thresholdData.lowerLimit) : 0,
        });

        console.log(
          `측정값 차트 데이터 로드 완료: ${formattedChartData.length}개, X축: ${xAxisType}`
        );
      } else {
        console.warn("시계열 데이터가 없습니다.");
      }
    } catch (error) {
      console.error("측정값 차트 로드 실패:", error);
    }
  };

  // ✅ 수율 차트 초기화
  const initializeYieldChart = () => {
    const savedTarget = localStorage.getItem("yieldTargetRate");
    const targetValue = savedTarget ? parseFloat(savedTarget) : 95;

    const initialChartData = [];
    for (let i = 9; i >= 0; i--) {
      const time = new Date(Date.now() - i * 300000);
      initialChartData.push({
        time: time.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        yieldRate: 94 + Math.random() * 4,
        targetRate: targetValue,
      });
    }
    setChartData(initialChartData);
    setChartMode("yield");
  };

  // 새로고침 버튼 핸들러
  const handleRefresh = async () => {
    if (selectedNgFilter) {
      // 필터가 있으면 해당 항목의 NG 데이터만 새로고침
      await loadMeasurements(selectedNgFilter);
      await loadMeasurementChart(selectedNgFilter);
    } else {
      // 필터가 없으면 전체 데이터 새로고침
      await loadMeasurements(null);
    }
    // 통계 데이터도 새로고침
    await loadData();
  };

  // 초기 데이터 로드 및 자동 새로고침 설정
  useEffect(() => {
    // 초기 데이터 로드
    const initializeData = async () => {
      await loadData();
      await loadMeasurements(null);
    };

    initializeData();

    // 차트 초기화 (수율 모드)
    initializeYieldChart();

    isInitialMount.current = false;
  }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행

  // 자동 새로고침 interval 설정
  useEffect(() => {
    const interval = setInterval(async () => {
      // 통계 데이터는 항상 업데이트
      await loadData();

      // 측정 데이터: 필터 상태에 따라 업데이트
      if (selectedNgFilter) {
        await loadMeasurements(selectedNgFilter);
        await loadMeasurementChart(selectedNgFilter, chartXAxis);
      } else {
        await loadMeasurements(null);
      }

      // 수율 모드일 때만 차트 데이터 업데이트
      if (chartMode === "yield") {
        const savedTarget = localStorage.getItem("yieldTargetRate");
        const targetValue = savedTarget ? parseFloat(savedTarget) : 95;

        setChartData((prev) => {
          const newData = [
            ...prev.slice(1),
            {
              time: new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              yieldRate: statistics.yieldRate || 95,
              targetRate: targetValue,
            },
          ];
          return newData;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    selectedNgFilter,
    chartMode,
    chartXAxis,
    loadData,
    loadMeasurements,
    statistics.yieldRate,
  ]);

  // selectedNgFilter가 변경될 때마다 측정 데이터 로드
  useEffect(() => {
    if (!isInitialMount.current) {
      console.log("selectedNgFilter 변경됨:", selectedNgFilter);
      // 필터 상태에 따라 측정 데이터 로드
      loadMeasurements(selectedNgFilter);
    }
  }, [selectedNgFilter, loadMeasurements]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Smart Factory Vision Monitor</h1>
        <div className="header-info">
          <span className="status-indicator"></span>
          <span className="last-update">
            마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
          </span>
          <button onClick={handleRefresh} className="refresh-btn">
            새로고침
          </button>
        </div>
      </header>

      <div className="statistics-grid">
        {/* 전체 생산량 */}
        <StatisticsCard
          title="전체 생산량"
          value={statistics.totalCount}
          unit="개"
          icon="📊"
          color="#2196F3"
          description="총 측정 데이터"
        />

        {/* OK 생산량 */}
        <StatisticsCard
          title="OK 생산량"
          value={statistics.okCount}
          unit="개"
          icon="✓"
          color="#4CAF50"
          description="합격 제품"
        />

        {/* NG 생산량 */}
        <StatisticsCard
          title="NG 생산량"
          value={statistics.ngCount}
          unit="개"
          icon="✗"
          color="#F44336"
          description="불합격 제품"
        />

        {/* 판정 합격률 */}
        <StatisticsCard
          title="판정 합격률"
          value={statistics.yieldRate.toFixed(1)}
          unit="%"
          icon="📈"
          color="#9C27B0"
          description="OK 비율"
        />

        {/* 장비 상태 */}
        <StatisticsCard
          title="장비 상태"
          value={statistics.machineStatus === "RUNNING" ? "가동중" : "정지"}
          icon="⚙"
          color={statistics.machineStatus === "RUNNING" ? "#4CAF50" : "#FF9800"}
          description="현재 작동 상태"
        />
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col-8">
          <SimpleChart
            data={chartData}
            mode={chartMode}
            thresholds={chartThresholds}
            selectedItem={selectedNgFilter}
            xAxisType={chartXAxis}
            onXAxisChange={setChartXAxis}
            onReload={(newXAxisType) => {
              if (selectedNgFilter) {
                loadMeasurementChart(
                  selectedNgFilter,
                  newXAxisType || chartXAxis
                );
              }
            }}
          />
        </div>
        <div className="dashboard-col-4">
          <div className="ng-summary">
            <h3 className="chart-title">항목별 NG 현황</h3>
            {isLoadingNgData && (
              <div className="ng-item-loading">데이터 로딩중...</div>
            )}
            <div className="ng-list">
              {Object.entries(ngData).map(([item, count]) => {
                const formattedItemForFilter =
                  "vertical_" + item.toLowerCase().replace(/ /g, "_");
                const isSelected = selectedNgFilter === formattedItemForFilter;

                return (
                  <div
                    key={item}
                    className={`ng-item ${
                      isSelected ? "ng-item-selected" : ""
                    } ${isLoadingNgData ? "ng-item-disabled" : ""}`}
                    onClick={() => !isLoadingNgData && handleNgItemClick(item)}
                  >
                    <span className="ng-item-name">
                      {formatItemName(item)}
                      {isSelected && (
                        <span className="selected-indicator"> ✓</span>
                      )}
                    </span>
                    <span className="ng-item-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col-4">
          <ControlPanel
            selectedItem={selectedControlItem}
            onItemChange={setSelectedControlItem}
          />
        </div>
        <div className="dashboard-col-8">
          <MeasurementTable
            measurements={measurements}
            selectedFilter={selectedNgFilter}
            onResetFilter={handleResetFilter}
            tableRef={measurementTableRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
