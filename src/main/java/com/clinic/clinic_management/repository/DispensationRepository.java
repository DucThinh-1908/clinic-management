package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Dispensation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DispensationRepository extends JpaRepository<Dispensation, Long> {
    Optional<Dispensation> findByPrescriptionId(Long prescriptionId);
    Optional<Dispensation> findByDispensationCode(String dispensationCode);
}
