import React, { useState, useEffect } from "react";

const MeasurementTable = ({
  measurements,
  selectedFilter,
  onResetFilter,
  tableRef,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

  // measurements 배열의 길이나 selectedFilter가 변경될 때 페이지 리셋
  useEffect(() => {
    console.log(
      "MeasurementTable: 데이터 변경됨",
      measurements.length,
      "건, 필터:",
      selectedFilter
    );
    setCurrentPage(1);
  }, [measurements.length, selectedFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = measurements.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(measurements.length / itemsPerPage);

  const getFilterLabel = (filterName) => {
    if (!filterName) return null;
    // "vertical_upper_diameter_2" → "Upper Diameter 2"
    return filterName
      .replace("vertical_", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // 항목명 포맷팅 (NG 사유 포함)
  const formatItemName = (measurementName, result, failReason) => {
    const baseName = measurementName
      ? measurementName
          .replace("vertical_", "")
          .split("_")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ")
      : "-";

    // NG이고 failReason이 있으면 함께 표시
    if (result === "NG" && failReason) {
      return `${baseName} (${failReason})`;
    }

    return baseName;
  };

  return (
    <div className="measurement-table-container" ref={tableRef}>
      <div className="table-header">
        <h3 className="table-title">
          최근 측정 데이터
          {selectedFilter && (
            <span className="filter-badge">
              {getFilterLabel(selectedFilter)} NG 항목
            </span>
          )}
        </h3>
        {selectedFilter && (
          <button onClick={onResetFilter} className="reset-filter-btn">
            전체 보기
          </button>
        )}
      </div>

      {measurements.length === 0 ? (
        <div className="no-data-message">해당 조건의 데이터가 없습니다.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="measurement-table">
              <thead>
                <tr>
                  <th>측정 시간</th>
                  <th>항목명</th>
                  <th>측정 항목</th>
                  <th>측정값</th>
                  <th>결과</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((measurement, index) => (
                  <tr key={`${measurement.id}-${index}`}>
                    <td>
                      {measurement.createdAt
                        ? new Date(measurement.createdAt).toLocaleString(
                            "ko-KR"
                          )
                        : "-"}
                    </td>
                    <td>
                      {formatItemName(
                        measurement.measurementName,
                        measurement.result,
                        measurement.failReason
                      )}
                    </td>
                    <td>{measurement.measurementName || "-"}</td>
                    <td>
                      {measurement.measurementValue !== null &&
                      measurement.measurementValue !== undefined
                        ? measurement.measurementValue.toFixed(3)
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`result-badge ${
                          measurement.result === "OK"
                            ? "result-ok"
                            : "result-ng"
                        }`}
                      >
                        {measurement.result || "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              이전
            </button>
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MeasurementTable;
