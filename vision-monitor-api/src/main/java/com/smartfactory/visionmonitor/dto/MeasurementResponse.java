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
public class MeasurementResponse {
    private Long id;
    private Integer rowIndex;

    // NG 데이터용 필드
    private String measurementName;    // 항목명 (예: vertical_upper_diameter_1)
    private Double measurementValue;   // 측정값
    private String result;             // OK 또는 NG
    private String failReason;         // NG 사유 (상한치 초과, 하한치 미달)
    private LocalDateTime createdAt;   // 측정 시간
}