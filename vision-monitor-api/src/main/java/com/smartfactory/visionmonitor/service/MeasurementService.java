package com.smartfactory.visionmonitor.service;

import com.smartfactory.visionmonitor.dto.MeasurementResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeasurementService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 최근 측정 데이터 조회
     * @param limit 조회할 데이터 개수
     * @param itemName 특정 항목 필터링 (null이면 전체 조회)
     * @return 측정 데이터 리스트
     */
    public List<MeasurementResponse> getRecentMeasurements(int limit, String itemName) {
        try {
            String sql;
            List<Map<String, Object>> results;

            if (itemName != null && !itemName.isEmpty()) {
                // 특정 항목의 NG 데이터만 조회
                log.info("특정 항목 NG 데이터 조회 - itemName: {}, limit: {}", itemName, limit);

                sql = """
                    SELECT 
                        qj.id,
                        qj.row_index,
                        qj.item_name as measurementName,
                        qj.measured_value as measurementValue,
                        qj.judgment as result,
                        qj.fail_reason as failReason,
                        vm.created_at as createdAt
                    FROM quality_judgments qj
                    INNER JOIN vertical_measurements vm ON qj.row_index = vm.row_index
                    WHERE qj.item_name = ? AND qj.judgment = 'NG'
                    ORDER BY vm.created_at DESC
                    LIMIT ?
                    """;
                results = jdbcTemplate.queryForList(sql, itemName, limit);
                log.info("특정 항목 NG 데이터 조회 완료: {} 건", results.size());

            } else {
                // 전체 데이터 조회 (OK + NG 모두)
                log.info("전체 측정 데이터 조회 시작 - limit: {}", limit);

                sql = """
                    SELECT 
                        qj.id,
                        qj.row_index,
                        qj.item_name as measurementName,
                        qj.measured_value as measurementValue,
                        qj.judgment as result,
                        qj.fail_reason as failReason,
                        vm.created_at as createdAt
                    FROM quality_judgments qj
                    INNER JOIN vertical_measurements vm ON qj.row_index = vm.row_index
                    ORDER BY vm.created_at DESC, qj.id DESC
                    LIMIT ?
                    """;
                results = jdbcTemplate.queryForList(sql, limit);
                log.info("전체 측정 데이터 조회 완료: {} 건 (OK + NG 포함)", results.size());
            }

            if (results.isEmpty()) {
                log.warn("조회된 측정 데이터가 없습니다. itemName: {}", itemName);
                return Collections.emptyList();
            }

            // 결과 통계 로그
            long okCount = results.stream().filter(r -> "OK".equals(r.get("result"))).count();
            long ngCount = results.stream().filter(r -> "NG".equals(r.get("result"))).count();
            log.info("조회 결과 통계 - OK: {}건, NG: {}건", okCount, ngCount);

            return results.stream()
                    .map(this::convertToResponse)
                    .filter(Objects::nonNull)
                    .toList();

        } catch (Exception e) {
            log.error("측정 데이터 조회 중 오류 발생 - itemName: {}, limit: {}", itemName, limit, e);
            return Collections.emptyList();
        }
    }

    /**
     * 특정 항목의 시계열 측정 데이터 조회 (차트용)
     * @param itemName 측정 항목명 (예: vertical_upper_diameter_1)
     * @param limit 조회할 데이터 개수
     * @return 시계열 측정 데이터 리스트
     */
    public List<MeasurementResponse> getMeasurementTimeSeries(String itemName, int limit) {
        try {
            log.info("시계열 데이터 조회 시작 - itemName: {}, limit: {}", itemName, limit);

            // vertical_measurements 테이블에서 해당 컬럼의 데이터를 직접 조회
            // 최근 limit개 제품을 가져온 뒤 오름차순으로 정렬
            String columnName = itemName; // 예: vertical_upper_diameter_1

            String sql = String.format("""
                SELECT * FROM (
                    SELECT 
                        vm.id,
                        vm.row_index,
                        '%s' as measurementName,
                        vm.%s as measurementValue,
                        vm.created_at as createdAt
                    FROM vertical_measurements vm
                    WHERE vm.%s IS NOT NULL
                    ORDER BY vm.row_index DESC
                    LIMIT ?
                ) AS recent_data
                ORDER BY row_index ASC
                """, columnName, columnName, columnName);

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, limit);
            log.info("시계열 데이터 조회 완료: {} 건 (제품번호 오름차순)", results.size());

            return results.stream()
                    .map(this::convertToResponse)
                    .filter(Objects::nonNull)
                    .toList();

        } catch (Exception e) {
            log.error("시계열 데이터 조회 중 오류 발생 - itemName: {}, limit: {}", itemName, limit, e);
            return Collections.emptyList();
        }
    }

    private MeasurementResponse convertToResponse(Map<String, Object> row) {
        try {
            LocalDateTime createdAt = null;
            Object createdAtObj = row.get("createdAt");

            if (createdAtObj instanceof Timestamp) {
                createdAt = ((Timestamp) createdAtObj).toLocalDateTime();
            } else if (createdAtObj instanceof LocalDateTime) {
                createdAt = (LocalDateTime) createdAtObj;
            }

            return MeasurementResponse.builder()
                    .id(row.get("id") != null ? ((Number) row.get("id")).longValue() : null)
                    .rowIndex(row.get("row_index") != null ? ((Number) row.get("row_index")).intValue() : null)
                    .measurementName((String) row.get("measurementName"))
                    .measurementValue(row.get("measurementValue") != null ?
                            ((Number) row.get("measurementValue")).doubleValue() : null)
                    .result((String) row.get("result"))
                    .failReason((String) row.get("failReason"))
                    .createdAt(createdAt)
                    .build();
        } catch (Exception e) {
            log.error("MeasurementResponse 변환 중 오류: {}", row, e);
            return null;
        }
    }
}