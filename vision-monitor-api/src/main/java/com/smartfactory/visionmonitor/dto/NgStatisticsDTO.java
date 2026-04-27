package com.smartfactory.visionmonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NgStatisticsDTO {
    private String itemName;
    private Long count;
}
