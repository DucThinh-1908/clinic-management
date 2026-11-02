package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.LabOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {
    List<LabOrder> findByMedicalRecordId(Long medicalRecordId);
    List<LabOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    Optional<LabOrder> findByOrderCode(String orderCode);
}
