package com.smartfactory.visionmonitor.controller;

import com.smartfactory.visionmonitor.dto.ThresholdSettingDTO;
import com.smartfactory.visionmonitor.entity.ThresholdSetting;
import com.smartfactory.visionmonitor.repository.ThresholdRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/thresholds")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ThresholdController {

    private final ThresholdRepository thresholdRepository;

    /**
     * 모든 임계값 조회
     * GET /api/thresholds
     */
    @GetMapping
    public ResponseEntity<List<ThresholdSettingDTO>> getAllThresholds() {
        log.info("모든 임계값 조회 요청");

        List<ThresholdSetting> entities = thresholdRepository.findAllOrderByItemName();
        List<ThresholdSettingDTO> dtos = entities.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());

        log.info("임계값 {}개 조회 완료", dtos.size());
        return ResponseEntity.ok(dtos);
    }

    /**
     * 특정 항목의 임계값 조회
     * GET /api/thresholds/{itemName}
     */
    @GetMapping("/{itemName}")
    public ResponseEntity<Object> getThreshold(@PathVariable String itemName) {
        log.info("임계값 조회 요청: {}", itemName);

        return thresholdRepository.findByItemName(itemName)
                .<ResponseEntity<Object>>map(entity -> {
                    ThresholdSettingDTO dto = entityToDto(entity);
                    log.info("임계값 조회 성공: {}", itemName);
                    return ResponseEntity.ok(dto);
                })
                .orElseGet(() -> {
                    log.warn("임계값 없음: {}", itemName);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Threshold not found for item: " + itemName));
                });
    }

    /**
     * 임계값 업데이트 (단일)
     * PUT /api/thresholds/{itemName}
     */
    @PutMapping("/{itemName}")
    public ResponseEntity<Object> updateThreshold(
            @PathVariable String itemName,
            @RequestBody ThresholdUpdateRequest request) {

        log.info("임계값 업데이트 요청: {} - 상한:{}, 하한:{}, 변경자:{}",
                itemName, request.getUpperLimit(), request.getLowerLimit(), request.getUpdatedBy());

        try {
            ThresholdSetting threshold = thresholdRepository.findByItemName(itemName)
                    .orElse(ThresholdSetting.builder()
                            .itemName(itemName)
                            .build());

            threshold.setUpperLimit(request.getUpperLimit());
            threshold.setLowerLimit(request.getLowerLimit());
            threshold.setUpdatedBy(request.getUpdatedBy() != null ? request.getUpdatedBy() : "admin");
            threshold.setUpdatedAt(LocalDateTime.now());

            ThresholdSetting saved = thresholdRepository.save(threshold);
            ThresholdSettingDTO dto = entityToDto(saved);

            log.info("임계값 업데이트 완료: {}", itemName);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("임계값 업데이트 실패: {}", itemName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update threshold: " + e.getMessage()));
        }
    }

    /**
     * 임계값 일괄 업데이트
     * PUT /api/thresholds/batch
     */
    @PutMapping("/batch")
    public ResponseEntity<Object> updateThresholdsBatch(@RequestBody BatchUpdateRequest request) {
        log.info("임계값 일괄 업데이트 요청: {}개 항목", request.getThresholds().size());

        try {
            int successCount = 0;
            int failCount = 0;

            for (ThresholdUpdateRequest item : request.getThresholds()) {
                try {
                    ThresholdSetting threshold = thresholdRepository.findByItemName(item.getItemName())
                            .orElse(ThresholdSetting.builder()
                                    .itemName(item.getItemName())
                                    .build());

                    threshold.setUpperLimit(item.getUpperLimit());
                    threshold.setLowerLimit(item.getLowerLimit());
                    threshold.setUpdatedBy(request.getUpdatedBy() != null ? request.getUpdatedBy() : "admin");
                    threshold.setUpdatedAt(LocalDateTime.now());

                    thresholdRepository.save(threshold);
                    successCount++;

                } catch (Exception e) {
                    log.error("항목 업데이트 실패: {}", item.getItemName(), e);
                    failCount++;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", successCount);
            response.put("failed", failCount);
            response.put("total", request.getThresholds().size());

            log.info("일괄 업데이트 완료 - 성공:{}, 실패:{}", successCount, failCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("일괄 업데이트 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Batch update failed: " + e.getMessage()));
        }
    }

    /**
     * Entity → DTO 변환
     */
    private ThresholdSettingDTO entityToDto(ThresholdSetting entity) {
        return ThresholdSettingDTO.builder()
                .id(entity.getId())
                .itemName(entity.getItemName())
                .upperLimit(entity.getUpperLimit())
                .lowerLimit(entity.getLowerLimit())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    // ========== Request DTOs ==========

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThresholdUpdateRequest {
        private String itemName;
        private BigDecimal upperLimit;
        private BigDecimal lowerLimit;
        private String updatedBy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchUpdateRequest {
        private List<ThresholdUpdateRequest> thresholds;
        private String updatedBy;
    }
}