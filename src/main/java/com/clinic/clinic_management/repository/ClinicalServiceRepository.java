package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.ClinicalService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicalServiceRepository extends JpaRepository<ClinicalService, Long> {
    List<ClinicalService> findByIsActiveTrue();
    List<ClinicalService> findByCategoryIdAndIsActiveTrue(Long categoryId);
    Optional<ClinicalService> findByCode(String code);
}
