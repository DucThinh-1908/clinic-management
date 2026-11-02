package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentCode(String paymentCode);

    List<Payment> findByInvoiceIdOrderByPaymentTimeDesc(Long invoiceId);

    List<Payment> findAllByOrderByPaymentTimeDesc();

    @Query("SELECT p FROM Payment p WHERE p.paymentTime BETWEEN :start AND :end ORDER BY p.paymentTime DESC")
    List<Payment> findByPaymentTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentTime >= :start AND p.paymentTime <= :end")
    Long countPaymentsToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
