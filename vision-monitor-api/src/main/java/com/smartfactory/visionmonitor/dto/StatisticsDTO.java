package com.smartfactory.visionmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDTO {
    private Long totalCount;
    private Double yieldRate;
    private String machineStatus;
    private LocalDateTime lastUpdate;
}
