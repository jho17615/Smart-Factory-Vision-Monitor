package com.smartfactory.visionmonitor.repository;

import com.smartfactory.visionmonitor.entity.Measurement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeasurementRepository extends JpaRepository<Measurement, Integer> {
    List<Measurement> findAllByOrderByCreatedAtDesc(Pageable pageable);
}