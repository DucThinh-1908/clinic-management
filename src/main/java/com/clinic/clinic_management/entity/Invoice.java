package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_code", nullable = false, unique = true, length = 50)
    private String invoiceCode;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "cashier_id")
    private Long cashierId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "medical_record_id")
    private Long medicalRecordId;

    @Column(name = "total_service_amount", precision = 12, scale = 2)
    private BigDecimal totalServiceAmount = BigDecimal.ZERO;

    @Column(name = "total_medicine_amount", precision = 12, scale = 2)
    private BigDecimal totalMedicineAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "insurance_paid_amount", precision = 12, scale = 2)
    private BigDecimal insurancePaidAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "status", length = 30)
    private String status = "UNPAID"; // UNPAID, PAID, REFUNDED, CANCELLED

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Invoice() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInvoiceCode() {
        return invoiceCode;
    }

    public void setInvoiceCode(String invoiceCode) {
        this.invoiceCode = invoiceCode;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getCashierId() {
        return cashierId;
    }

    public void setCashierId(Long cashierId) {
        this.cashierId = cashierId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Long getMedicalRecordId() {
        return medicalRecordId;
    }

    public void setMedicalRecordId(Long medicalRecordId) {
        this.medicalRecordId = medicalRecordId;
    }

    public BigDecimal getTotalServiceAmount() {
        return totalServiceAmount != null ? totalServiceAmount : BigDecimal.ZERO;
    }

    public void setTotalServiceAmount(BigDecimal totalServiceAmount) {
        this.totalServiceAmount = totalServiceAmount;
    }

    public BigDecimal getTotalMedicineAmount() {
        return totalMedicineAmount != null ? totalMedicineAmount : BigDecimal.ZERO;
    }

    public void setTotalMedicineAmount(BigDecimal totalMedicineAmount) {
        this.totalMedicineAmount = totalMedicineAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount != null ? discountAmount : BigDecimal.ZERO;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getInsurancePaidAmount() {
        return insurancePaidAmount != null ? insurancePaidAmount : BigDecimal.ZERO;
    }

    public void setInsurancePaidAmount(BigDecimal insurancePaidAmount) {
        this.insurancePaidAmount = insurancePaidAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount != null ? finalAmount : BigDecimal.ZERO;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
