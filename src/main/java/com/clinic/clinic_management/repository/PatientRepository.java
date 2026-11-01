package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientCode(String patientCode);

    Optional<Patient> findByPhone(String phone);

    Optional<Patient> findByIdentityCard(String identityCard);

    Optional<Patient> findByUserId(Long userId);

    boolean existsByPatientCode(String patientCode);

    boolean existsByPhone(String phone);

    boolean existsByIdentityCard(String identityCard);

    Optional<Patient> findTopByOrderByIdDesc();

    @Query("SELECT p FROM Patient p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "p.phone LIKE CONCAT('%', :keyword, '%') OR " +
           "LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "p.identityCard LIKE CONCAT('%', :keyword, '%') OR " +
           "p.healthInsuranceNumber LIKE CONCAT('%', :keyword, '%')) AND " +
           "(:activeOnly = false OR p.isActive = true) " +
           "ORDER BY p.id DESC")
    List<Patient> searchPatients(@Param("keyword") String keyword, @Param("activeOnly") boolean activeOnly);

    List<Patient> findByMergedIntoId(Long mergedIntoId);
}
