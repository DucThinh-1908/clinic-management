package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    Optional<MedicalRecord> findByRecordCode(String recordCode);

    long countByPatientId(Long patientId);

    @Modifying
    @Query("UPDATE MedicalRecord m SET m.patientId = :targetId WHERE m.patientId = :sourceId")
    int reassignPatient(@Param("sourceId") Long sourceId, @Param("targetId") Long targetId);
}
