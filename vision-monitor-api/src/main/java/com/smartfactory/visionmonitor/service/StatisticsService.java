package com.smartfactory.visionmonitor.service;

import com.smartfactory.visionmonitor.dto.StatisticsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final JdbcTemplate jdbcTemplate;

    public StatisticsResponse getRealtimeStatistics() {
        try {
            log.info("=== 통계 계산 시작 ===");

            // 1. 전체 생산량 (vertical_measurements 테이블의 총 레코드 수)
            Integer totalCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM vertical_measurements",
                    Integer.class
            );
            log.info("1. 전체 생산량: {}", totalCount);

            // 2. NG 제품 수: NG 판정이 하나라도 있는 제품(row_index) 수
            Integer ngCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(DISTINCT row_index) 
                    FROM quality_judgments 
                    WHERE judgment = 'NG'
                    """,
                    Integer.class
            );
            log.info("2. NG 생산량 (NG 판정이 있는 제품): {}", ngCount);

            // 3. 판정 데이터가 있는 제품 중 OK만 있는 제품 수
            Integer okCountWithJudgment = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(DISTINCT row_index) 
                    FROM quality_judgments 
                    WHERE judgment = 'OK'
                    AND row_index NOT IN (
                        SELECT DISTINCT row_index 
                        FROM quality_judgments 
                        WHERE judgment = 'NG'
                    )
                    """,
                    Integer.class
            );
            log.info("3. OK 생산량 (판정 데이터 있음): {}", okCountWithJudgment);

            // 4. 판정 데이터가 없는 제품 수
            Integer productsWithoutJudgment = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) 
                    FROM vertical_measurements vm
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM quality_judgments qj 
                        WHERE qj.row_index = vm.row_index
                    )
                    """,
                    Integer.class
            );
            log.info("4. 판정 데이터 없는 제품: {}", productsWithoutJudgment);

            // 5. OK 생산량 = OK 판정 제품 + 판정 없는 제품 (판정 없으면 OK로 간주)
            Integer okCount = okCountWithJudgment + productsWithoutJudgment;

            log.info("5. 최종 OK 생산량: {} (판정 OK: {} + 판정 없음: {})",
                    okCount, okCountWithJudgment, productsWithoutJudgment);

            // null 체크
            if (totalCount == null) totalCount = 0;
            if (ngCount == null) ngCount = 0;
            if (okCount == null) okCount = 0;
            if (productsWithoutJudgment == null) productsWithoutJudgment = 0;

            // 검증: OK + NG vs 전체
            Integer calculatedTotal = okCount + ngCount;
            log.info("=== 통계 검증 ===");
            log.info("전체 생산량: {}", totalCount);
            log.info("OK 생산량: {} (판정 OK: {} + 판정 없음: {})",
                    okCount, okCountWithJudgment, productsWithoutJudgment);
            log.info("NG 생산량: {}", ngCount);
            log.info("계산된 합계 (OK + NG): {}", calculatedTotal);

            if (calculatedTotal.equals(totalCount)) {
                log.info("✓ 통계 일치 확인됨");
            } else {
                log.warn("⚠️ 통계 불일치 발견!");
                log.warn("   - 전체: {}", totalCount);
                log.warn("   - 계산: {}", calculatedTotal);
                log.warn("   - 차이: {}", totalCount - calculatedTotal);
            }

            // 4. 합격률 계산
            double yieldRate = 0.0;
            if (totalCount > 0) {
                yieldRate = (okCount * 100.0) / totalCount;
            }

            // 5. 기계 상태 확인 (최근 2분 내 데이터 있는지)
            LocalDateTime twoMinutesAgo = LocalDateTime.now().minusMinutes(2);
            Integer recentDataCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM vertical_measurements WHERE created_at >= ?",
                    Integer.class,
                    twoMinutesAgo
            );

            String machineStatus = "STOPPED";
            if (recentDataCount != null && recentDataCount > 0) {
                machineStatus = "RUNNING";
            }

            // 6. 최근 생산 속도 계산 (최근 10분간 평균)
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            Integer lastTenMinutesCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM vertical_measurements WHERE created_at >= ?",
                    Integer.class,
                    tenMinutesAgo
            );

            double productionRate = 0.0;
            if (lastTenMinutesCount != null) {
                productionRate = lastTenMinutesCount / 10.0; // 분당 생산량
            }

            log.info("=== 최종 통계 결과 ===");
            log.info("전체: {}, OK: {}, NG: {}, 합격률: {}%, 상태: {}, 생산속도: {}/분",
                    totalCount, okCount, ngCount,
                    String.format("%.1f", yieldRate),
                    machineStatus,
                    String.format("%.1f", productionRate));

            return StatisticsResponse.builder()
                    .totalCount(totalCount)
                    .okCount(okCount)
                    .ngCount(ngCount)
                    .yieldRate(yieldRate)
                    .machineStatus(machineStatus)
                    .productionRate(productionRate)
                    .collectionTime(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("통계 데이터 조회 중 오류 발생", e);
            return StatisticsResponse.builder()
                    .totalCount(0)
                    .okCount(0)
                    .ngCount(0)
                    .yieldRate(0.0)
                    .machineStatus("ERROR")
                    .productionRate(0.0)
                    .collectionTime(LocalDateTime.now())
                    .build();
        }
    }

    public Map<String, Integer> getNgCountByItem() {
        try {
            log.info("=== NG 통계 조회 시작 ===");

            // 전체 기간의 NG 통계 (날짜 제한 없음)
            // row_index 기준으로 제품 단위 카운트
            String sql = """
                SELECT 
                    qj.item_name,
                    COUNT(DISTINCT qj.row_index) as count
                FROM quality_judgments qj
                WHERE qj.judgment = 'NG'
                GROUP BY qj.item_name
                ORDER BY count DESC
                """;

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);

            Map<String, Integer> ngStats = new LinkedHashMap<>();
            int totalNgItems = 0;

            for (Map<String, Object> row : results) {
                String itemName = (String) row.get("item_name");
                Integer count = ((Number) row.get("count")).intValue();
                totalNgItems += count;

                // vertical_upper_diameter_1 → Upper Diameter 1
                String displayName = formatItemName(itemName);

                ngStats.put(displayName, count);

                log.info("NG 항목: {} = {} 건", displayName, count);
            }

            log.info("=== NG 통계 조회 완료 ===");
            log.info("총 {} 개 측정 항목에 NG 발생", ngStats.size());
            log.info("총 NG 발생 횟수: {} 건 (중복 포함)", totalNgItems);

            return ngStats;

        } catch (Exception e) {
            log.error("NG 통계 조회 중 오류 발생", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * 항목명을 읽기 쉬운 형태로 변환
     */
    private String formatItemName(String itemName) {
        return itemName
                .replace("vertical_", "")
                .replace("_", " ")
                .toLowerCase();
    }

    /**
     * 최근 생산 추이 조회 (차트용)
     */
    public Map<String, Integer> getRecentProductionTrend() {
        try {
            // 최근 24시간 동안 시간별 생산량
            LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);

            String sql = """
                SELECT 
                    DATE_FORMAT(created_at, '%H:00') as hour,
                    COUNT(*) as count
                FROM vertical_measurements
                WHERE created_at >= ?
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H')
                ORDER BY hour
                """;

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, twentyFourHoursAgo);

            Map<String, Integer> hourlyStats = new LinkedHashMap<>();

            // 24시간 초기화
            for (int i = 0; i < 24; i++) {
                String hour = String.format("%02d:00", i);
                hourlyStats.put(hour, 0);
            }

            // 실제 데이터 채우기
            for (Map<String, Object> row : results) {
                String hour = (String) row.get("hour");
                Integer count = ((Number) row.get("count")).intValue();
                hourlyStats.put(hour, count);
            }

            return hourlyStats;
        } catch (Exception e) {
            log.error("생산 추이 조회 중 오류 발생", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * DB 통계 검증 메서드 (디버깅용)
     */
    public Map<String, Object> validateStatistics() {
        Map<String, Object> validation = new LinkedHashMap<>();

        try {
            // 1. vertical_measurements 테이블 통계
            Integer totalMeasurements = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM vertical_measurements",
                    Integer.class
            );

            // 2. quality_judgments 테이블 통계
            Integer totalJudgments = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM quality_judgments",
                    Integer.class
            );

            Integer distinctRowIndexInJudgments = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT row_index) FROM quality_judgments",
                    Integer.class
            );

            Integer okJudgments = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM quality_judgments WHERE judgment = 'OK'",
                    Integer.class
            );

            Integer ngJudgments = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM quality_judgments WHERE judgment = 'NG'",
                    Integer.class
            );

            Integer ngProducts = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT row_index) FROM quality_judgments WHERE judgment = 'NG'",
                    Integer.class
            );

            // 3. row_index 매칭 확인
            Integer measurementsWithJudgments = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(DISTINCT vm.id) 
                    FROM vertical_measurements vm
                    WHERE EXISTS (
                        SELECT 1 FROM quality_judgments qj 
                        WHERE qj.row_index = vm.row_index
                    )
                    """,
                    Integer.class
            );

            validation.put("totalMeasurements", totalMeasurements);
            validation.put("totalJudgments", totalJudgments);
            validation.put("distinctRowIndexInJudgments", distinctRowIndexInJudgments);
            validation.put("okJudgments", okJudgments);
            validation.put("ngJudgments", ngJudgments);
            validation.put("ngProducts", ngProducts);
            validation.put("measurementsWithJudgments", measurementsWithJudgments);
            validation.put("measurementsWithoutJudgments", totalMeasurements - measurementsWithJudgments);

            log.info("=== DB 검증 결과 ===");
            log.info("vertical_measurements 총 레코드: {}", totalMeasurements);
            log.info("quality_judgments 총 판정: {}", totalJudgments);
            log.info("quality_judgments 고유 제품(row_index): {}", distinctRowIndexInJudgments);
            log.info("OK 판정: {}", okJudgments);
            log.info("NG 판정: {}", ngJudgments);
            log.info("NG 제품 수: {}", ngProducts);
            log.info("판정 데이터가 있는 제품: {}", measurementsWithJudgments);
            log.info("판정 데이터가 없는 제품: {}", totalMeasurements - measurementsWithJudgments);

        } catch (Exception e) {
            log.error("DB 검증 중 오류 발생", e);
            validation.put("error", e.getMessage());
        }

        return validation;
    }
}