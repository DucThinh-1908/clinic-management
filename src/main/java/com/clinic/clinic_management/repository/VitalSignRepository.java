package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.VitalSign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {
    List<VitalSign> findByPatientIdOrderByMeasuredAtDesc(Long patientId);
    Optional<VitalSign> findFirstByPatientIdOrderByMeasuredAtDesc(Long patientId);
}
