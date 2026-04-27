package com.smartfactory.visionmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsResponse {
    private Integer totalCount;      // 전체 생산량
    private Integer okCount;         // OK 생산량
    private Integer ngCount;         // NG 생산량
    private Double yieldRate;        // 합격률
    private String machineStatus;    // 장비 상태
    private Double productionRate;   // 분당 생산량 (추가)
    private LocalDateTime collectionTime;
}