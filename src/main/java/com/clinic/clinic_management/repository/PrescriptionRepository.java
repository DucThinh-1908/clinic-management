package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByPrescriptionCode(String prescriptionCode);

    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Prescription> findByMedicalRecordId(Long medicalRecordId);

    List<Prescription> findByStatusOrderByCreatedAtDesc(String status);

    List<Prescription> findAllByOrderByCreatedAtDesc();
}
