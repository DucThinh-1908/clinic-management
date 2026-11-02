package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    List<Invoice> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Invoice> findByMedicalRecordId(Long medicalRecordId);

    Optional<Invoice> findFirstByMedicalRecordIdOrderByCreatedAtDesc(Long medicalRecordId);

    List<Invoice> findAllByOrderByCreatedAtDesc();

    List<Invoice> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT i FROM Invoice i WHERE i.createdAt BETWEEN :start AND :end ORDER BY i.createdAt DESC")
    List<Invoice> findByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.createdAt BETWEEN :start AND :end ORDER BY i.createdAt DESC")
    List<Invoice> findByStatusAndCreatedAtBetween(
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= :start AND i.createdAt <= :end")
    Long countInvoicesToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
