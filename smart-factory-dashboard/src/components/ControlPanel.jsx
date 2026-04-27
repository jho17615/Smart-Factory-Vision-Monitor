// src/components/ControlPanel.jsx
import React, { useState, useEffect } from "react";
import { updateThreshold, getThreshold } from "../services/api";
import { isAdmin, getUserInfo } from "../services/auth";
import "./ControlPanel.css";

const ControlPanel = ({ selectedItem: externalSelectedItem, onItemChange }) => {
  const [selectedItem, setSelectedItem] = useState("vertical_upper_diameter");
  const [upperLimit, setUpperLimit] = useState(46.106);
  const [lowerLimit, setLowerLimit] = useState(45.994);
  const [currentDbThreshold, setCurrentDbThreshold] = useState(null);
  const [message, setMessage] = useState("시스템이 정상 작동 중입니다.");
  const [messageType, setMessageType] = useState("success");
  const [changeHistory, setChangeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 권한 체크
  const canEdit = isAdmin();
  const userInfo = getUserInfo();

  const measurementItems = [
    {
      value: "vertical_upper_diameter",
      label: "UPPER_DIAMETER",
      defaultUpper: 46.106,
      defaultLower: 45.994,
    },
    {
      value: "vertical_lower_diameter",
      label: "LOWER_DIAMETER",
      defaultUpper: 46.04,
      defaultLower: 45.96,
    },
    {
      value: "vertical_left_length",
      label: "LEFT_LENGTH",
      defaultUpper: 103.88,
      defaultLower: 103.72,
    },
    {
      value: "vertical_right_length",
      label: "RIGHT_LENGTH",
      defaultUpper: 103.88,
      defaultLower: 103.72,
    },
    {
      value: "vertical_left_roundness",
      label: "LEFT_ROUNDNESS",
      defaultUpper: 1.5,
      defaultLower: 0,
    },
    {
      value: "vertical_right_roundness",
      label: "RIGHT_ROUNDNESS",
      defaultUpper: 1.5,
      defaultLower: 0,
    },
    {
      value: "vertical_left_angle",
      label: "LEFT_ANGLE",
      defaultUpper: 2.5,
      defaultLower: 0,
    },
    {
      value: "vertical_right_angle",
      label: "RIGHT_ANGLE",
      defaultUpper: 2.5,
      defaultLower: 0,
    },
  ];

  // localStorage에서 변경 이력 로드
  useEffect(() => {
    const loadHistory = () => {
      try {
        const tabId = sessionStorage.getItem("tabId");
        const username = localStorage.getItem(`tab_${tabId}_username`);

        console.log("🔍 변경 이력 로드 시도");
        console.log("tabId:", tabId);
        console.log("username:", username);

        if (username) {
          const historyKey = `user_${username}_threshold_history`;
          const savedHistory = localStorage.getItem(historyKey);

          console.log("historyKey:", historyKey);
          console.log("savedHistory:", savedHistory);

          if (savedHistory) {
            const parsedHistory = JSON.parse(savedHistory);
            console.log("✅ 이력 로드 성공:", parsedHistory);
            setChangeHistory(parsedHistory);
          } else {
            console.log("⚠️ 저장된 이력 없음");
          }
        } else {
          console.log("❌ 로그인 정보 없음");
        }
      } catch (error) {
        console.error("❌ 변경 이력 로드 실패:", error);
      }
    };

    loadHistory();
  }, []);

  // 변경 이력 저장 함수
  const saveHistoryToStorage = (newHistory) => {
    try {
      const tabId = sessionStorage.getItem("tabId");
      const username = localStorage.getItem(`tab_${tabId}_username`);

      console.log("💾 변경 이력 저장 시도");
      console.log("tabId:", tabId);
      console.log("username:", username);
      console.log("newHistory:", newHistory);

      if (username) {
        const historyKey = `user_${username}_threshold_history`;
        localStorage.setItem(historyKey, JSON.stringify(newHistory));
        console.log("✅ 이력 저장 성공:", historyKey);

        const saved = localStorage.getItem(historyKey);
        console.log("저장된 데이터 확인:", saved);
      } else {
        console.log("❌ username 없음, 저장 실패");
      }
    } catch (error) {
      console.error("❌ 변경 이력 저장 실패:", error);
    }
  };

  // DB에서 임계값 로드 (통합 버전)
  const loadThresholdFromDB = async (itemName, isExternal = false) => {
    try {
      console.log(`🔍 DB에서 ${itemName} 임계값 조회 중...`);
      const data = await getThreshold(itemName);

      if (data && data.upperLimit != null && data.lowerLimit != null) {
        // DB에 값이 있으면 DB 값 사용
        const upper = parseFloat(data.upperLimit);
        const lower = parseFloat(data.lowerLimit);

        setCurrentDbThreshold(data);
        setUpperLimit(upper);
        setLowerLimit(lower);

        console.log(`✅ DB 값 로드: 상한=${upper}, 하한=${lower}`);

        const itemConfig = measurementItems.find((m) => m.value === itemName);
        const messageText = isExternal
          ? `${itemConfig.label} 항목 (외부 선택) - DB 최신값 로드됨`
          : `${itemConfig.label} 항목 선택 (DB 최신값 로드됨)`;

        setMessage(messageText);
        setMessageType("success");
      } else {
        // DB에 값이 없으면 기본값 사용
        console.log("⚠️ DB에 값 없음, 기본값 사용");
        setCurrentDbThreshold(null);

        const item = measurementItems.find((m) => m.value === itemName);
        setUpperLimit(item.defaultUpper);
        setLowerLimit(item.defaultLower);

        setMessage(`${item.label} 항목 선택 (DB에 값 없음 - 기본값 사용)`);
        setMessageType("info");
      }
    } catch (error) {
      console.error("임계값 로드 실패:", error);
      setCurrentDbThreshold(null);

      const item = measurementItems.find((m) => m.value === itemName);
      setUpperLimit(item.defaultUpper);
      setLowerLimit(item.defaultLower);

      setMessage(`${item.label} 항목 선택 (DB 조회 실패 - 기본값 사용)`);
      setMessageType("info");
    }
  };

  // 컴포넌트 마운트 시 초기 로드
  useEffect(() => {
    loadThresholdFromDB(selectedItem);
  }, []);

  // 외부에서 항목 변경 시
  useEffect(() => {
    if (externalSelectedItem && externalSelectedItem !== selectedItem) {
      console.log("🔄 외부 항목으로 변경:", externalSelectedItem);
      setSelectedItem(externalSelectedItem);
      loadThresholdFromDB(externalSelectedItem, true);
    }
  }, [externalSelectedItem]);

  // 항목 변경 핸들러
  const handleItemChange = (e) => {
    const newItem = e.target.value;
    setSelectedItem(newItem);
    loadThresholdFromDB(newItem);

    if (onItemChange) {
      onItemChange(newItem);
    }
  };

  // 상한치 변경
  const handleUpperChange = (e) => {
    if (!canEdit) return;
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setUpperLimit(value);
    }
  };

  // 하한치 변경
  const handleLowerChange = (e) => {
    if (!canEdit) return;
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLowerLimit(value);
    }
  };

  // 임계값 적용 (통합 버전)
  const handleApply = async () => {
    if (!canEdit) {
      setMessage("❌ 권한 없음: 관리자만 임계값을 수정할 수 있습니다.");
      setMessageType("error");
      return;
    }

    if (upperLimit <= lowerLimit) {
      setMessage("❌ 오류: 상한치는 하한치보다 커야 합니다!");
      setMessageType("error");
      return;
    }

    try {
      // 중복 체크 (DB 값과 비교)
      if (currentDbThreshold) {
        const isDuplicateWithDB =
          parseFloat(currentDbThreshold.upperLimit) === upperLimit &&
          parseFloat(currentDbThreshold.lowerLimit) === lowerLimit;

        if (isDuplicateWithDB) {
          const itemLabel = measurementItems.find(
            (m) => m.value === selectedItem
          )?.label;
          setMessage(
            `⚠️ ${itemLabel} 항목에 이미 동일한 값이 DB에 저장되어 있습니다.`
          );
          setMessageType("error");
          return;
        }
      }

      console.log(
        `🔄 DB 동기화 시작: ${selectedItem} - 상한:${upperLimit}, 하한:${lowerLimit}`
      );

      // DB에 저장
      const result = await updateThreshold(
        selectedItem,
        upperLimit,
        lowerLimit,
        userInfo?.username || "admin"
      );

      console.log("✅ DB 동기화 성공:", result);

      // DB 값 업데이트
      setCurrentDbThreshold({
        ...result,
        upperLimit: upperLimit,
        lowerLimit: lowerLimit,
        updatedAt: new Date().toISOString(),
        updatedBy: userInfo?.username || "admin",
      });

      // 변경 이력 저장
      const itemLabel = measurementItems.find(
        (m) => m.value === selectedItem
      )?.label;
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        item: selectedItem,
        itemLabel: itemLabel,
        upperLimit: upperLimit,
        lowerLimit: lowerLimit,
        user: userInfo?.fullName || "관리자",
      };

      const newHistory = [historyEntry, ...changeHistory].slice(0, 50);
      setChangeHistory(newHistory);
      saveHistoryToStorage(newHistory);

      setMessage(`✅ ${itemLabel} 임계값이 DB에 저장되었습니다.`);
      setMessageType("success");

      // DB에서 최신 값 다시 로드
      await loadThresholdFromDB(selectedItem);
    } catch (error) {
      console.error("임계값 업데이트 실패:", error);
      setMessage(`❌ 실패: ${error.message}`);
      setMessageType("error");
    }
  };

  // 초기화
  const handleReset = () => {
    if (!canEdit) {
      setMessage("❌ 권한 없음: 관리자만 초기화할 수 있습니다.");
      setMessageType("error");
      return;
    }

    const item = measurementItems.find((m) => m.value === selectedItem);
    setUpperLimit(item.defaultUpper);
    setLowerLimit(item.defaultLower);
    setMessage("값이 기본값으로 초기화되었습니다. 적용 버튼을 눌러주세요.");
    setMessageType("info");
  };

  // 변경 이력 클릭 (통합 버전)
  const handleHistoryClick = async (entry) => {
    if (!canEdit) {
      setMessage("❌ 권한 없음: 관리자만 임계값을 수정할 수 있습니다.");
      setMessageType("error");
      return;
    }

    setSelectedItem(entry.item);
    setUpperLimit(entry.upperLimit);
    setLowerLimit(entry.lowerLimit);

    // 이력 클릭 시에도 DB 값 조회
    try {
      const dbThreshold = await getThreshold(entry.item);
      if (
        dbThreshold &&
        dbThreshold.upperLimit != null &&
        dbThreshold.lowerLimit != null
      ) {
        setCurrentDbThreshold(dbThreshold);
      } else {
        setCurrentDbThreshold(null);
      }
    } catch (error) {
      console.warn("이력 항목 DB 조회 실패:", error);
      setCurrentDbThreshold(null);
    }

    if (onItemChange) {
      onItemChange(entry.item);
    }

    setMessage(
      `📋 이력에서 불러옴: ${entry.itemLabel} (${formatDateTime(
        entry.timestamp
      )})`
    );
    setMessageType("info");
  };

  // 이력 전체 삭제
  const handleClearHistory = () => {
    if (!canEdit) {
      setMessage("❌ 권한 없음: 관리자만 이력을 삭제할 수 있습니다.");
      setMessageType("error");
      return;
    }

    if (window.confirm("모든 변경 이력을 삭제하시겠습니까?")) {
      setChangeHistory([]);
      saveHistoryToStorage([]);
      setMessage("변경 이력이 삭제되었습니다.");
      setMessageType("success");
    }
  };

  // 날짜 포맷팅
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h3 className="panel-title">임계값 제어 패널</h3>
        {!canEdit && <span className="permission-badge">🔒 읽기 전용</span>}
      </div>

      <div className="panel-body">
        {/* 측정 항목 선택 */}
        <div className="form-group">
          <label>측정 항목</label>
          <select
            value={selectedItem}
            onChange={handleItemChange}
            className="form-select"
          >
            {measurementItems.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* 상한치 */}
        <div className="form-group">
          <label>상한치 (Upper Limit)</label>
          <input
            type="number"
            step="0.001"
            value={upperLimit}
            onChange={handleUpperChange}
            className="form-input"
            disabled={!canEdit}
          />
        </div>

        {/* 하한치 */}
        <div className="form-group">
          <label>하한치 (Lower Limit)</label>
          <input
            type="number"
            step="0.001"
            value={lowerLimit}
            onChange={handleLowerChange}
            className="form-input"
            disabled={!canEdit}
          />
        </div>

        {/* 현재 DB 값 표시 */}
        {currentDbThreshold ? (
          <div className="db-threshold-info">
            <p className="info-title">📌 현재 DB 저장값</p>
            <p className="info-text">
              상한: {parseFloat(currentDbThreshold.upperLimit).toFixed(3)} /
              하한: {parseFloat(currentDbThreshold.lowerLimit).toFixed(3)}
            </p>
            <p className="info-text-small">
              마지막 수정: {currentDbThreshold.updatedBy} /{" "}
              {new Date(currentDbThreshold.updatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        ) : (
          <div className="db-threshold-info warning">
            <p className="info-title">⚠️ DB에 저장된 값 없음</p>
            <p className="info-text-small">
              현재 표시된 값은 기본값입니다. '적용' 버튼을 눌러 DB에 저장하세요.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="button-group">
          <button
            onClick={handleApply}
            className="btn btn-primary"
            disabled={!canEdit}
          >
            적용 (DB 저장)
          </button>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={!canEdit}
          >
            초기화
          </button>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`message message-${messageType}`}>{message}</div>
        )}

        {/* 변경 이력 */}
        {canEdit && (
          <div className="history-section">
            <div className="history-header-row">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="history-toggle"
              >
                {showHistory ? "▼" : "▶"} 변경 이력 ({changeHistory.length})
              </button>
              {changeHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="clear-history-btn"
                >
                  전체 삭제
                </button>
              )}
            </div>

            {showHistory && (
              <div className="history-list">
                {changeHistory.length === 0 ? (
                  <p className="no-history">변경 이력이 없습니다.</p>
                ) : (
                  changeHistory.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="history-item"
                      onClick={() => handleHistoryClick(entry)}
                    >
                      <div className="history-item-header">
                        <span className="history-item-label">
                          {entry.itemLabel}
                        </span>
                        <span className="history-time">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      <div className="history-detail">
                        상한: {entry.upperLimit} / 하한: {entry.lowerLimit}
                      </div>
                      <div className="history-user">변경자: {entry.user}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
