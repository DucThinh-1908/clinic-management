package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispensations")
public class Dispensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispensation_code", nullable = false, unique = true, length = 50)
    private String dispensationCode;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "pharmacist_id", nullable = false)
    private Long pharmacistId;

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt = LocalDateTime.now();

    @Column(length = 255)
    private String note;

    public Dispensation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDispensationCode() { return dispensationCode; }
    public void setDispensationCode(String dispensationCode) { this.dispensationCode = dispensationCode; }
    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
    public Long getPharmacistId() { return pharmacistId; }
    public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
    public LocalDateTime getDispensedAt() { return dispensedAt; }
    public void setDispensedAt(LocalDateTime dispensedAt) { this.dispensedAt = dispensedAt; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
