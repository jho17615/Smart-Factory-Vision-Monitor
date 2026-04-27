package com.smartfactory.visionmonitor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quality_judgments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Judgment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "measurement_id", nullable = false)
    private Integer measurementId;

    @Column(name = "row_index", nullable = false)
    private Integer rowIndex;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "measured_value", nullable = false, precision = 10, scale = 3)
    private BigDecimal measuredValue;

    @Column(name = "upper_limit", nullable = false, precision = 10, scale = 3)
    private BigDecimal upperLimit;

    @Column(name = "lower_limit", nullable = false, precision = 10, scale = 3)
    private BigDecimal lowerLimit;

    @Column(name = "judgment", nullable = false)
    @Enumerated(EnumType.STRING)
    private JudgmentResult judgment;

    @Column(name = "fail_reason", length = 50)
    private String failReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum JudgmentResult {
        OK, NG
    }
}