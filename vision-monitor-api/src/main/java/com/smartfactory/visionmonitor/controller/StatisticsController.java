package com.smartfactory.visionmonitor.controller;

import com.smartfactory.visionmonitor.dto.MeasurementResponse;
import com.smartfactory.visionmonitor.dto.StatisticsResponse;
import com.smartfactory.visionmonitor.service.MeasurementService;
import com.smartfactory.visionmonitor.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final MeasurementService measurementService;

    /**
     * 실시간 통계 조회
     * GET /api/statistics/latest
     */
    @GetMapping("/statistics/latest")
    public StatisticsResponse getLatestStatistics() {
        return statisticsService.getRealtimeStatistics();
    }

    /**
     * 항목별 NG 통계 조회
     * GET /api/statistics/ng-by-item
     */
    @GetMapping("/statistics/ng-by-item")
    public Map<String, Integer> getNgCountByItem() {
        return statisticsService.getNgCountByItem();
    }

    /**
     * 최근 측정 데이터 조회
     * GET /api/measurements/recent
     */
    @GetMapping("/measurements/recent")
    public List<MeasurementResponse> getRecentMeasurements(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String itemName) {
        return measurementService.getRecentMeasurements(limit, itemName);
    }

    /**
     * 특정 항목의 시계열 측정 데이터 조회 (차트용)
     * GET /api/measurements/timeseries
     */
    @GetMapping("/measurements/timeseries")
    public List<MeasurementResponse> getMeasurementTimeSeries(
            @RequestParam String itemName,
            @RequestParam(defaultValue = "20") int limit) {
        return measurementService.getMeasurementTimeSeries(itemName, limit);
    }
}