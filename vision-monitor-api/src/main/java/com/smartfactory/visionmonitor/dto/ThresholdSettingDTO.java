package com.smartfactory.visionmonitor.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThresholdSettingDTO {
    private Integer id;
    private String itemName;
    private BigDecimal upperLimit;
    private BigDecimal lowerLimit;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
