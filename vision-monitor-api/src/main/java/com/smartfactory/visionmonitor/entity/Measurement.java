package com.smartfactory.visionmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vertical_measurements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "row_index")
    private Integer rowIndex;

    @Column(name = "vertical_num")
    private BigDecimal verticalNum;

    @Column(name = "vertical_upper_diameter_1")
    private BigDecimal verticalUpperDiameter1;

    @Column(name = "vertical_upper_diameter_2")
    private BigDecimal verticalUpperDiameter2;

    @Column(name = "vertical_upper_diameter_avg")
    private BigDecimal verticalUpperDiameterAvg;

    @Column(name = "vertical_lower_diameter_1")
    private BigDecimal verticalLowerDiameter1;

    @Column(name = "vertical_lower_diameter_2")
    private BigDecimal verticalLowerDiameter2;

    @Column(name = "vertical_left_length_1")
    private BigDecimal verticalLeftLength1;

    @Column(name = "vertical_left_length_2")
    private BigDecimal verticalLeftLength2;

    @Column(name = "vertical_right_length_1")
    private BigDecimal verticalRightLength1;

    @Column(name = "vertical_right_length_2")
    private BigDecimal verticalRightLength2;

    @Column(name = "vertical_left_roundness_1")
    private BigDecimal verticalLeftRoundness1;

    @Column(name = "vertical_left_roundness_2")
    private BigDecimal verticalLeftRoundness2;

    @Column(name = "vertical_right_roundness_1")
    private BigDecimal verticalRightRoundness1;

    @Column(name = "vertical_right_roundness_2")
    private BigDecimal verticalRightRoundness2;

    @Column(name = "vertical_left_angle_1")
    private BigDecimal verticalLeftAngle1;

    @Column(name = "vertical_left_angle_2")
    private BigDecimal verticalLeftAngle2;

    @Column(name = "vertical_right_angle_1")
    private BigDecimal verticalRightAngle1;

    @Column(name = "vertical_right_angle_2")
    private BigDecimal verticalRightAngle2;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}