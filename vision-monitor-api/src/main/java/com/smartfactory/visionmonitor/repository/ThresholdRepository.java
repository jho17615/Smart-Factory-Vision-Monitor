package com.smartfactory.visionmonitor.repository;

import com.smartfactory.visionmonitor.entity.ThresholdSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ThresholdRepository extends JpaRepository<ThresholdSetting, Integer> {

    /**
     * 항목명으로 임계값 조회
     * @param itemName 항목명
     * @return ThresholdSetting
     */
    Optional<ThresholdSetting> findByItemName(String itemName);

    /**
     * 항목명 존재 여부 확인
     * @param itemName 항목명
     * @return 존재 여부
     */
    boolean existsByItemName(String itemName);

    /**
     * 모든 임계값 조회 (항목명 기준 정렬)
     */
    @Query("SELECT t FROM ThresholdSetting t ORDER BY t.itemName")
    java.util.List<ThresholdSetting> findAllOrderByItemName();
}
