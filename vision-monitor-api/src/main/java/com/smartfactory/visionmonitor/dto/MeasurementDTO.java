package com.smartfactory.visionmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeasurementDTO {
    private Integer id;
    private LocalDateTime measureTime;
    private String itemName;
    private String measurementName;
    private BigDecimal measurementValue;
    private String result;
}
