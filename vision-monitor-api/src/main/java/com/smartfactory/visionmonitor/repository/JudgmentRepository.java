package com.smartfactory.visionmonitor.repository;

import com.smartfactory.visionmonitor.entity.Judgment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface JudgmentRepository extends JpaRepository<Judgment, Integer> {

    // 전체 판정 개수
    @Query("SELECT COUNT(j) FROM Judgment j")
    Long countTotal();

    // OK 개수
    @Query("SELECT COUNT(j) FROM Judgment j WHERE j.judgment = 'OK'")
    Long countOk();

    // NG 개수
    @Query("SELECT COUNT(j) FROM Judgment j WHERE j.judgment = 'NG'")
    Long countNg();

    // 특정 항목의 NG 개수
    @Query("SELECT COUNT(j) FROM Judgment j WHERE j.judgment = 'NG' AND j.itemName = :itemName")
    Long countNgByItemName(String itemName);
}