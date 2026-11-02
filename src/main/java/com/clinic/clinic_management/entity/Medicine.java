package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "brand_name", nullable = false, length = 150)
    private String brandName;

    @Column(name = "active_ingredient", nullable = false, length = 150)
    private String activeIngredient;

    @Column(name = "dosage_form", nullable = false, length = 50)
    private String dosageForm;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(name = "usage_instructions", length = 255)
    private String usageInstructions;

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "is_prescription_required")
    private Boolean isPrescriptionRequired = true;

    @Column(columnDefinition = "TEXT")
    private String contraindications;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Medicine() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }
    public String getActiveIngredient() { return activeIngredient; }
    public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getUsageInstructions() { return usageInstructions; }
    public void setUsageInstructions(String usageInstructions) { this.usageInstructions = usageInstructions; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }
    public Boolean getIsPrescriptionRequired() { return isPrescriptionRequired; }
    public void setIsPrescriptionRequired(Boolean isPrescriptionRequired) { this.isPrescriptionRequired = isPrescriptionRequired; }
    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
