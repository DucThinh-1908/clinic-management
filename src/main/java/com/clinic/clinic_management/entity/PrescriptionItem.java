package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "medicine_id", nullable = false)
    private Long medicineId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "morning_dose", length = 20)
    private String morningDose = "0";

    @Column(name = "noon_dose", length = 20)
    private String noonDose = "0";

    @Column(name = "afternoon_dose", length = 20)
    private String afternoonDose = "0";

    @Column(name = "night_dose", length = 20)
    private String nightDose = "0";

    @Column(length = 255)
    private String instructions;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    public PrescriptionItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getMorningDose() { return morningDose; }
    public void setMorningDose(String morningDose) { this.morningDose = morningDose; }
    public String getNoonDose() { return noonDose; }
    public void setNoonDose(String noonDose) { this.noonDose = noonDose; }
    public String getAfternoonDose() { return afternoonDose; }
    public void setAfternoonDose(String afternoonDose) { this.afternoonDose = afternoonDose; }
    public String getNightDose() { return nightDose; }
    public void setNightDose(String nightDose) { this.nightDose = nightDose; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
