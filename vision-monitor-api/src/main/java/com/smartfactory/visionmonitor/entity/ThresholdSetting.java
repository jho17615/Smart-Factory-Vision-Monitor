package com.smartfactory.visionmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "threshold_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThresholdSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "item_name", nullable = false, unique = true, length = 100)
    private String itemName;

    @Column(name = "upper_limit", nullable = false, precision = 10, scale = 3)
    private BigDecimal upperLimit;

    @Column(name = "lower_limit", nullable = false, precision = 10, scale = 3)
    private BigDecimal lowerLimit;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.updatedBy == null) {
            this.updatedBy = "admin";
        }
    }
}
