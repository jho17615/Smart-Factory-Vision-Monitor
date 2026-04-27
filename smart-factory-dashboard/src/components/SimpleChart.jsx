import React, { useState, useEffect, useRef } from "react";

const SimpleChart = ({
  data,
  mode = "yield",
  thresholds = { upper: 0, lower: 0 },
  selectedItem = null,
  xAxisType = "time",
  onXAxisChange,
  onReload,
}) => {
  const [targetRate, setTargetRate] = useState(95);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(95);
  const svgRef = useRef(null);

  const width = 700;
  const height = 320;
  const padding = 50;

  // X축 기준 변경 핸들러
  const handleXAxisChange = async (newType) => {
    console.log(`X축 변경: ${xAxisType} → ${newType}`);

    if (onXAxisChange) {
      onXAxisChange(newType);
    }

    // 약간의 딜레이 후 데이터 다시 로드 (상태 업데이트 대기)
    setTimeout(async () => {
      if (onReload) {
        await onReload(newType);
      }
    }, 50);
  };

  // 모드에 따라 Y축 범위 동적 계산
  const getYAxisRange = () => {
    if (mode === "yield") {
      return { maxY: 100, minY: 0 };
    } else {
      // 측정값 모드: 데이터 범위 + 임계값 고려
      const values = data.map((d) => d.measurementValue || 0);
      const dataMax = Math.max(...values, thresholds.upper);
      const dataMin = Math.min(...values, thresholds.lower);
      const range = dataMax - dataMin;
      const padding = range * 0.1; // 10% 여유

      return {
        maxY: dataMax + padding,
        minY: Math.max(0, dataMin - padding),
      };
    }
  };

  const { maxY, minY } = getYAxisRange();

  // localStorage에서 목표치 불러오기
  useEffect(() => {
    const savedTarget = localStorage.getItem("yieldTargetRate");
    if (savedTarget) {
      const target = parseFloat(savedTarget);
      setTargetRate(target);
      setTempTarget(target);
    }
  }, []);

  const xScale = (index) =>
    padding + (index * (width - 2 * padding)) / (data.length - 1);
  const yScale = (value) =>
    height -
    padding -
    ((value - minY) / (maxY - minY)) * (height - 2 * padding);

  // Y축 값에서 실제 값으로 역변환
  const yScaleInverse = (yPos) => {
    const ratio = (height - padding - yPos) / (height - 2 * padding);
    return minY + ratio * (maxY - minY);
  };

  // 모드에 따라 다른 데이터 라인 생성
  const getMainPathData = () => {
    if (mode === "yield") {
      return data
        .map(
          (d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.yieldRate)}`
        )
        .join(" ");
    } else {
      return data
        .map(
          (d, i) =>
            `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(
              d.measurementValue || 0
            )}`
        )
        .join(" ");
    }
  };

  const pathData = getMainPathData();

  // 목표선 (수율 모드에만 사용)
  const targetPathData = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(targetRate)}`)
    .join(" ");

  // 임계값 선 (측정값 모드에만 사용)
  const upperLimitPath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(thresholds.upper)}`
    )
    .join(" ");

  const lowerLimitPath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(thresholds.lower)}`
    )
    .join(" ");

  // 드래그 이벤트 핸들러
  const handlePointerDown = (e) => {
    if (isEditing) return; // 수치 입력 중에는 드래그 비활성화
    e.preventDefault();
    setIsDragging(true);
    setShowTooltip(true);
    updateTargetFromEvent(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateTargetFromEvent(e);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setIsDragging(false);

    setTimeout(() => {
      setShowTooltip(false);
    }, 500);

    localStorage.setItem("yieldTargetRate", targetRate.toString());
  };

  const updateTargetFromEvent = (e) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;
    const yPos = clientY - rect.top;
    const clampedY = Math.max(padding, Math.min(height - padding, yPos));

    let newTarget = yScaleInverse(clampedY);
    newTarget = Math.max(0, Math.min(100, newTarget));
    newTarget = Math.round(newTarget * 10) / 10;

    setTargetRate(newTarget);
    setTempTarget(newTarget);
  };

  // 수치 입력 핸들러
  const handleTargetUpdate = () => {
    const newTarget = parseFloat(tempTarget);
    if (isNaN(newTarget)) {
      alert("올바른 숫자를 입력해주세요.");
      return;
    }
    if (newTarget < 0 || newTarget > 100) {
      alert("목표치는 0%에서 100% 사이여야 합니다.");
      return;
    }
    setTargetRate(newTarget);
    localStorage.setItem("yieldTargetRate", newTarget.toString());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempTarget(targetRate);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // 숫자와 소수점만 허용
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTempTarget(value);
    }
  };

  // 전역 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e) => handlePointerMove(e);
      const handleGlobalUp = (e) => handlePointerUp(e);

      window.addEventListener("mousemove", handleGlobalMove);
      window.addEventListener("mouseup", handleGlobalUp);
      window.addEventListener("touchmove", handleGlobalMove, {
        passive: false,
      });
      window.addEventListener("touchend", handleGlobalUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMove);
        window.removeEventListener("mouseup", handleGlobalUp);
        window.removeEventListener("touchmove", handleGlobalMove);
        window.removeEventListener("touchend", handleGlobalUp);
      };
    }
  }, [isDragging, targetRate]);

  return (
    <div className="chart-container">
      <div
        className="chart-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h3 className="chart-title" style={{ margin: 0 }}>
          {mode === "yield" ? "시간대별 수율 추이" : "측정값 추이"}
          {mode === "measurement" && selectedItem && (
            <span
              style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}
            >
              (
              {selectedItem
                .replace("vertical_", "")
                .replace(/_/g, " ")
                .toUpperCase()}
              )
            </span>
          )}
        </h3>

        {/* 측정값 모드: X축 기준 선택 버튼 */}
        {mode === "measurement" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f5f5f5",
              padding: "8px 12px",
              borderRadius: "6px",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#666", fontWeight: "500" }}
            >
              X축 기준:
            </span>
            <button
              onClick={() => handleXAxisChange("time")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor: xAxisType === "time" ? "#2196F3" : "white",
                color: xAxisType === "time" ? "white" : "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: xAxisType === "time" ? "600" : "400",
                transition: "all 0.2s",
              }}
            >
              시간순
            </button>
            <button
              onClick={() => handleXAxisChange("row_index")}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor:
                  xAxisType === "row_index" ? "#2196F3" : "white",
                color: xAxisType === "row_index" ? "white" : "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: xAxisType === "row_index" ? "600" : "400",
                transition: "all 0.2s",
              }}
            >
              제품번호순
            </button>
          </div>
        )}

        {mode === "yield" && (
          <div
            className="target-control"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {!isEditing ? (
              <>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    fontWeight: "500",
                  }}
                >
                  목표 수율:{" "}
                  <strong style={{ color: "#FF9800" }}>
                    {targetRate.toFixed(1)}%
                  </strong>
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "13px",
                    backgroundColor: "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  수치 입력
                </button>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    fontStyle: "italic",
                  }}
                >
                  (또는 드래그)
                </span>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={tempTarget}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleTargetUpdate();
                    if (e.key === "Escape") handleCancel();
                  }}
                  autoFocus
                  style={{
                    width: "70px",
                    padding: "4px 8px",
                    fontSize: "13px",
                    border: "2px solid #FF9800",
                    borderRadius: "4px",
                    textAlign: "center",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#666" }}>%</span>
                <button
                  onClick={handleTargetUpdate}
                  style={{
                    padding: "4px 12px",
                    fontSize: "13px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  적용
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "4px 12px",
                    fontSize: "13px",
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  취소
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          cursor: isDragging ? "grabbing" : isEditing ? "default" : "default",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* Grid lines - 모드에 따라 동적 생성 */}
        {mode === "yield"
          ? // 수율 모드: 0-100, 10단위
            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
              <g key={value}>
                <line
                  x1={padding}
                  y1={yScale(value)}
                  x2={width - padding}
                  y2={yScale(value)}
                  className="chart-grid-line"
                  stroke="#e0e0e0"
                  strokeWidth="1"
                  opacity={value % 20 === 0 ? 0.8 : 0.4}
                />
                <text
                  x={padding - 10}
                  y={yScale(value)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="chart-axis-label"
                  fontSize="11"
                  fill="#666"
                >
                  {value}%
                </text>
              </g>
            ))
          : // 측정값 모드: 동적 범위
            Array.from({ length: 6 }, (_, i) => {
              const value = minY + (i * (maxY - minY)) / 5;
              return (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={yScale(value)}
                    x2={width - padding}
                    y2={yScale(value)}
                    className="chart-grid-line"
                    stroke="#e0e0e0"
                    strokeWidth="1"
                    opacity={0.6}
                  />
                  <text
                    x={padding - 10}
                    y={yScale(value)}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="chart-axis-label"
                    fontSize="11"
                    fill="#666"
                  >
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}

        {/* 수율 모드: 목표선 (드래그 가능) */}
        {mode === "yield" && (
          <g
            onMouseDown={!isEditing ? handlePointerDown : undefined}
            onTouchStart={!isEditing ? handlePointerDown : undefined}
            style={{ cursor: isEditing ? "default" : "ns-resize" }}
          >
            {/* 투명한 넓은 영역 (클릭/터치 영역 확대) */}
            {!isEditing && (
              <path
                d={targetPathData}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
              />
            )}

            {/* 실제 보이는 선 */}
            <path
              d={targetPathData}
              className="chart-target-line"
              stroke="#FF9800"
              strokeWidth={isDragging ? "3" : "2"}
              strokeDasharray="5,5"
              fill="none"
            />

            {/* 드래그 핸들 (수치 입력 모드가 아닐 때만 표시) */}
            {!isEditing && (
              <>
                <circle
                  cx={padding}
                  cy={yScale(targetRate)}
                  r={isDragging ? "8" : "6"}
                  fill="#FF9800"
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    cursor: "ns-resize",
                    filter: isDragging
                      ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                      : "none",
                  }}
                />

                <circle
                  cx={width - padding}
                  cy={yScale(targetRate)}
                  r={isDragging ? "8" : "6"}
                  fill="#FF9800"
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    cursor: "ns-resize",
                    filter: isDragging
                      ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                      : "none",
                  }}
                />
              </>
            )}
          </g>
        )}

        {/* 측정값 모드: 상한치/하한치 라인 */}
        {mode === "measurement" && (
          <>
            {/* 상한치 라인 */}
            <path
              d={upperLimitPath}
              stroke="#F44336"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
            {/* 하한치 라인 */}
            <path
              d={lowerLimitPath}
              stroke="#2196F3"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          </>
        )}

        {/* 메인 데이터 라인 */}
        <path
          d={pathData}
          className="chart-line"
          stroke={mode === "yield" ? "#4CAF50" : "#9C27B0"}
          strokeWidth="2"
          fill="none"
        />

        {/* 데이터 포인트 */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(
              mode === "yield" ? d.yieldRate : d.measurementValue || 0
            )}
            r="4"
            fill={mode === "yield" ? "#4CAF50" : "#9C27B0"}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % 2 === 0) {
            return (
              <text
                key={i}
                x={xScale(i)}
                y={height - padding + 20}
                textAnchor="middle"
                className="chart-axis-label"
                fontSize="11"
                fill="#666"
              >
                {d.time}
              </text>
            );
          }
          return null;
        })}

        {/* Legend - 모드별로 다르게 표시 */}
        {mode === "yield" ? (
          <g transform={`translate(${width - 150}, 20)`}>
            <line
              x1="0"
              y1="0"
              x2="30"
              y2="0"
              stroke="#4CAF50"
              strokeWidth="2"
            />
            <text
              x="35"
              y="5"
              className="chart-axis-label"
              fontSize="12"
              fill="#666"
            >
              수율
            </text>

            <line
              x1="0"
              y1="20"
              x2="30"
              y2="20"
              stroke="#FF9800"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="35"
              y="25"
              className="chart-axis-label"
              fontSize="12"
              fill="#666"
            >
              목표
            </text>
          </g>
        ) : (
          <g transform={`translate(${width - 180}, 20)`}>
            <line
              x1="0"
              y1="0"
              x2="30"
              y2="0"
              stroke="#9C27B0"
              strokeWidth="2"
            />
            <text
              x="35"
              y="5"
              className="chart-axis-label"
              fontSize="11"
              fill="#666"
            >
              측정값
            </text>

            <line
              x1="0"
              y1="20"
              x2="30"
              y2="20"
              stroke="#F44336"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="35"
              y="25"
              className="chart-axis-label"
              fontSize="11"
              fill="#666"
            >
              상한
            </text>

            <line
              x1="0"
              y1="40"
              x2="30"
              y2="40"
              stroke="#2196F3"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="35"
              y="45"
              className="chart-axis-label"
              fontSize="11"
              fill="#666"
            >
              하한
            </text>
          </g>
        )}

        {/* 드래그 중 툴팁 (수율 모드만) */}
        {mode === "yield" && (isDragging || showTooltip) && (
          <g>
            <rect
              x={width / 2 - 50}
              y={yScale(targetRate) - 35}
              width="100"
              height="30"
              rx="4"
              fill="#FF9800"
              opacity="0.95"
              style={{
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
              }}
            />
            <text
              x={width / 2}
              y={yScale(targetRate) - 15}
              textAnchor="middle"
              fill="white"
              fontSize="16"
              fontWeight="bold"
            >
              {targetRate.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default SimpleChart;
