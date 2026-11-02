package com.clinic.clinic_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PharmacyDtos {

    // =========================================================================
    // UC-DT01 & UC-DT03: KÊ ĐƠN THUỐC & IN ĐƠN THUỐC
    // =========================================================================
    public static class CreatePrescriptionRequest {
        private Long medicalRecordId;
        private Long doctorId;
        private Long patientId;
        private String diagnosis;
        private String usageNote;
        private List<PrescriptionItemRequest> items = new ArrayList<>();

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getUsageNote() { return usageNote; }
        public void setUsageNote(String usageNote) { this.usageNote = usageNote; }
        public List<PrescriptionItemRequest> getItems() { return items; }
        public void setItems(List<PrescriptionItemRequest> items) { this.items = items; }
    }

    public static class PrescriptionItemRequest {
        private Long medicineId;
        private Integer quantity;
        private String morningDose;
        private String noonDose;
        private String afternoonDose;
        private String nightDose;
        private String instructions;

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
    }

    public static class PrescriptionResponse {
        private Long id;
        private String prescriptionCode;
        private Long medicalRecordId;
        private Long doctorId;
        private String doctorName;
        private Long patientId;
        private String patientName;
        private String patientCode;
        private String patientPhone;
        private String diagnosis;
        private String usageNote;
        private String status;
        private LocalDateTime createdAt;
        private BigDecimal totalAmount;
        private List<PrescriptionItemResponse> items = new ArrayList<>();

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getPrescriptionCode() { return prescriptionCode; }
        public void setPrescriptionCode(String prescriptionCode) { this.prescriptionCode = prescriptionCode; }
        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientPhone() { return patientPhone; }
        public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getUsageNote() { return usageNote; }
        public void setUsageNote(String usageNote) { this.usageNote = usageNote; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public List<PrescriptionItemResponse> getItems() { return items; }
        public void setItems(List<PrescriptionItemResponse> items) { this.items = items; }
    }

    public static class PrescriptionItemResponse {
        private Long id;
        private Long medicineId;
        private String medicineCode;
        private String brandName;
        private String activeIngredient;
        private String dosageForm;
        private String unit;
        private Integer quantity;
        private String morningDose;
        private String noonDose;
        private String afternoonDose;
        private String nightDose;
        private String instructions;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getMedicineCode() { return medicineCode; }
        public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getActiveIngredient() { return activeIngredient; }
        public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
        public String getDosageForm() { return dosageForm; }
        public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
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

    // =========================================================================
    // UC-DT02: CẢNH BÁO DỊ ỨNG KHI KÊ ĐƠN
    // =========================================================================
    public static class AllergyCheckRequest {
        private Long patientId;
        private List<Long> medicineIds = new ArrayList<>();

        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public List<Long> getMedicineIds() { return medicineIds; }
        public void setMedicineIds(List<Long> medicineIds) { this.medicineIds = medicineIds; }
    }

    public static class AllergyAlertResponse {
        private boolean hasRisk;
        private String patientAllergies;
        private List<AllergyWarningItem> warnings = new ArrayList<>();

        public boolean isHasRisk() { return hasRisk; }
        public void setHasRisk(boolean hasRisk) { this.hasRisk = hasRisk; }
        public String getPatientAllergies() { return patientAllergies; }
        public void setPatientAllergies(String patientAllergies) { this.patientAllergies = patientAllergies; }
        public List<AllergyWarningItem> getWarnings() { return warnings; }
        public void setWarnings(List<AllergyWarningItem> warnings) { this.warnings = warnings; }
    }

    public static class AllergyWarningItem {
        private Long medicineId;
        private String brandName;
        private String activeIngredient;
        private String matchedAllergyKeyword;
        private String severity; // HIGH, MEDIUM
        private String message;

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getActiveIngredient() { return activeIngredient; }
        public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
        public String getMatchedAllergyKeyword() { return matchedAllergyKeyword; }
        public void setMatchedAllergyKeyword(String matchedAllergyKeyword) { this.matchedAllergyKeyword = matchedAllergyKeyword; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    // =========================================================================
    // UC-DT03: MẪU IN ĐƠN THUỐC CHUẨN A4
    // =========================================================================
    public static class PrescriptionPrintDto {
        private String clinicName = "PHÒNG KHÁM ĐA KHOA QUỐC TẾ CAREPLUS";
        private String clinicAddress = "Số 123 Đường Giải Phóng, Quận Đống Đa, Hà Nội";
        private String clinicHotline = "1900 6868 - (024) 3822 5588";

        private Long prescriptionId;
        private String prescriptionCode;
        private LocalDateTime createdAt;
        private String recordCode;

        private Long patientId;
        private String patientCode;
        private String patientName;
        private String gender;
        private Integer age;
        private LocalDate dateOfBirth;
        private String phone;
        private String address;
        private String healthInsuranceNumber;

        private String diagnosis;
        private String icd10Code;
        private String doctorAdvice;
        private LocalDate followUpDate;
        private String doctorName;
        private String pharmacistName;

        private BigDecimal totalAmount;
        private List<PrescriptionItemResponse> items = new ArrayList<>();

        public String getClinicName() { return clinicName; }
        public String getClinicAddress() { return clinicAddress; }
        public String getClinicHotline() { return clinicHotline; }
        public Long getPrescriptionId() { return prescriptionId; }
        public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
        public String getPrescriptionCode() { return prescriptionCode; }
        public void setPrescriptionCode(String prescriptionCode) { this.prescriptionCode = prescriptionCode; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getPharmacistName() { return pharmacistName; }
        public void setPharmacistName(String pharmacistName) { this.pharmacistName = pharmacistName; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public List<PrescriptionItemResponse> getItems() { return items; }
        public void setItems(List<PrescriptionItemResponse> items) { this.items = items; }
    }

    // =========================================================================
    // UC-DT04: CẤP PHÁT THUỐC THEO ĐƠN
    // =========================================================================
    public static class DispensePrescriptionRequest {
        private Long prescriptionId;
        private Long pharmacistId;
        private String note;

        public Long getPrescriptionId() { return prescriptionId; }
        public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
        public Long getPharmacistId() { return pharmacistId; }
        public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class DispensationResponse {
        private Long id;
        private String dispensationCode;
        private Long prescriptionId;
        private String prescriptionCode;
        private Long pharmacistId;
        private String pharmacistName;
        private String patientName;
        private LocalDateTime dispensedAt;
        private String note;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getDispensationCode() { return dispensationCode; }
        public void setDispensationCode(String dispensationCode) { this.dispensationCode = dispensationCode; }
        public Long getPrescriptionId() { return prescriptionId; }
        public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }
        public String getPrescriptionCode() { return prescriptionCode; }
        public void setPrescriptionCode(String prescriptionCode) { this.prescriptionCode = prescriptionCode; }
        public Long getPharmacistId() { return pharmacistId; }
        public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
        public String getPharmacistName() { return pharmacistName; }
        public void setPharmacistName(String pharmacistName) { this.pharmacistName = pharmacistName; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public LocalDateTime getDispensedAt() { return dispensedAt; }
        public void setDispensedAt(LocalDateTime dispensedAt) { this.dispensedAt = dispensedAt; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    // =========================================================================
    // UC-DT05: QUẢN LÝ DANH MỤC THUỐC
    // =========================================================================
    public static class SaveMedicineRequest {
        private Long id; // null khi tạo mới
        private Long categoryId;
        private String code;
        private String brandName;
        private String activeIngredient;
        private String dosageForm;
        private String unit;
        private String usageInstructions;
        private BigDecimal sellingPrice;
        private Boolean isPrescriptionRequired = true;
        private String contraindications;
        private Boolean isActive = true;

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

    public static class MedicineDetailDto {
        private Long id;
        private Long categoryId;
        private String categoryName;
        private String code;
        private String brandName;
        private String activeIngredient;
        private String dosageForm;
        private String unit;
        private String usageInstructions;
        private BigDecimal sellingPrice;
        private Boolean isPrescriptionRequired;
        private String contraindications;
        private Boolean isActive;
        private Integer totalAvailableQuantity;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
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
        public Integer getTotalAvailableQuantity() { return totalAvailableQuantity; }
        public void setTotalAvailableQuantity(Integer totalAvailableQuantity) { this.totalAvailableQuantity = totalAvailableQuantity; }
    }

    // =========================================================================
    // UC-DT06: NHẬP KHO THUỐC
    // =========================================================================
    public static class ImportStockRequest {
        private Long medicineId;
        private Long supplierId;
        private String batchNumber;
        private LocalDate manufactureDate;
        private LocalDate expiryDate;
        private BigDecimal importPrice;
        private Integer quantityImported;
        private Long pharmacistId;
        private String note;

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public Long getSupplierId() { return supplierId; }
        public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public LocalDate getManufactureDate() { return manufactureDate; }
        public void setManufactureDate(LocalDate manufactureDate) { this.manufactureDate = manufactureDate; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
        public BigDecimal getImportPrice() { return importPrice; }
        public void setImportPrice(BigDecimal importPrice) { this.importPrice = importPrice; }
        public Integer getQuantityImported() { return quantityImported; }
        public void setQuantityImported(Integer quantityImported) { this.quantityImported = quantityImported; }
        public Long getPharmacistId() { return pharmacistId; }
        public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class BatchDetailDto {
        private Long id;
        private Long medicineId;
        private String medicineCode;
        private String brandName;
        private String activeIngredient;
        private String unit;
        private Long supplierId;
        private String supplierName;
        private String batchNumber;
        private LocalDate manufactureDate;
        private LocalDate expiryDate;
        private BigDecimal importPrice;
        private Integer quantityImported;
        private Integer quantityAvailable;
        private LocalDateTime createdAt;
        private boolean isExpired;
        private long daysUntilExpiry;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getMedicineCode() { return medicineCode; }
        public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getActiveIngredient() { return activeIngredient; }
        public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Long getSupplierId() { return supplierId; }
        public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
        public String getSupplierName() { return supplierName; }
        public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public LocalDate getManufactureDate() { return manufactureDate; }
        public void setManufactureDate(LocalDate manufactureDate) { this.manufactureDate = manufactureDate; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
        public BigDecimal getImportPrice() { return importPrice; }
        public void setImportPrice(BigDecimal importPrice) { this.importPrice = importPrice; }
        public Integer getQuantityImported() { return quantityImported; }
        public void setQuantityImported(Integer quantityImported) { this.quantityImported = quantityImported; }
        public Integer getQuantityAvailable() { return quantityAvailable; }
        public void setQuantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public boolean isExpired() { return isExpired; }
        public void setExpired(boolean expired) { isExpired = expired; }
        public long getDaysUntilExpiry() { return daysUntilExpiry; }
        public void setDaysUntilExpiry(long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; }
    }

    // =========================================================================
    // UC-DT07: KIỂM KÊ TỒN KHO THUỐC
    // =========================================================================
    public static class StockAuditRequest {
        private Long batchId;
        private Long pharmacistId;
        private Integer actualQuantity;
        private String reason;

        public Long getBatchId() { return batchId; }
        public void setBatchId(Long batchId) { this.batchId = batchId; }
        public Long getPharmacistId() { return pharmacistId; }
        public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
        public Integer getActualQuantity() { return actualQuantity; }
        public void setActualQuantity(Integer actualQuantity) { this.actualQuantity = actualQuantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // =========================================================================
    // UC-DT08: CẢNH BÁO THUỐC SẮP HẾT / SẮP HẾT HẠN
    // =========================================================================
    public static class StockAlertOverviewDto {
        private int lowStockCount;
        private int nearExpiryCount;
        private int expiredCount;
        private List<StockAlertItemDto> alerts = new ArrayList<>();

        public int getLowStockCount() { return lowStockCount; }
        public void setLowStockCount(int lowStockCount) { this.lowStockCount = lowStockCount; }
        public int getNearExpiryCount() { return nearExpiryCount; }
        public void setNearExpiryCount(int nearExpiryCount) { this.nearExpiryCount = nearExpiryCount; }
        public int getExpiredCount() { return expiredCount; }
        public void setExpiredCount(int expiredCount) { this.expiredCount = expiredCount; }
        public List<StockAlertItemDto> getAlerts() { return alerts; }
        public void setAlerts(List<StockAlertItemDto> alerts) { this.alerts = alerts; }
    }

    public static class StockAlertItemDto {
        private String alertType; // LOW_STOCK, NEAR_EXPIRY, EXPIRED
        private Long medicineId;
        private String medicineCode;
        private String brandName;
        private String activeIngredient;
        private String unit;
        private Long batchId;
        private String batchNumber;
        private Integer quantityAvailable;
        private Integer threshold;
        private LocalDate expiryDate;
        private Long daysRemaining;
        private String severity; // HIGH, WARNING, CRITICAL
        private String message;

        public String getAlertType() { return alertType; }
        public void setAlertType(String alertType) { this.alertType = alertType; }
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getMedicineCode() { return medicineCode; }
        public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getActiveIngredient() { return activeIngredient; }
        public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Long getBatchId() { return batchId; }
        public void setBatchId(Long batchId) { this.batchId = batchId; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public Integer getQuantityAvailable() { return quantityAvailable; }
        public void setQuantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; }
        public Integer getThreshold() { return threshold; }
        public void setThreshold(Integer threshold) { this.threshold = threshold; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
        public Long getDaysRemaining() { return daysRemaining; }
        public void setDaysRemaining(Long daysRemaining) { this.daysRemaining = daysRemaining; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    // =========================================================================
    // UC-DT09: QUẢN LÝ NHÀ CUNG CẤP
    // =========================================================================
    public static class SaveSupplierRequest {
        private Long id;
        private String name;
        private String taxCode;
        private String phone;
        private String email;
        private String address;
        private Boolean isActive = true;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getTaxCode() { return taxCode; }
        public void setTaxCode(String taxCode) { this.taxCode = taxCode; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }

    public static class SupplierDetailDto {
        private Long id;
        private String name;
        private String taxCode;
        private String phone;
        private String email;
        private String address;
        private Boolean isActive;
        private int batchCount;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getTaxCode() { return taxCode; }
        public void setTaxCode(String taxCode) { this.taxCode = taxCode; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public int getBatchCount() { return batchCount; }
        public void setBatchCount(int batchCount) { this.batchCount = batchCount; }
    }

    // =========================================================================
    // UC-DT10: LỊCH SỬ NHẬP - XUẤT THUỐC
    // =========================================================================
    public static class StockTransactionDto {
        private Long id;
        private Long batchId;
        private String batchNumber;
        private Long medicineId;
        private String medicineCode;
        private String brandName;
        private String unit;
        private Long pharmacistId;
        private String pharmacistName;
        private String transactionType; // IMPORT, DISPENSE, DISPOSE, AUDIT_ADJUSTMENT
        private Integer quantity;
        private String reason;
        private LocalDateTime transactionDate;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getBatchId() { return batchId; }
        public void setBatchId(Long batchId) { this.batchId = batchId; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public String getMedicineCode() { return medicineCode; }
        public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
        public String getBrandName() { return brandName; }
        public void setBrandName(String brandName) { this.brandName = brandName; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Long getPharmacistId() { return pharmacistId; }
        public void setPharmacistId(Long pharmacistId) { this.pharmacistId = pharmacistId; }
        public String getPharmacistName() { return pharmacistName; }
        public void setPharmacistName(String pharmacistName) { this.pharmacistName = pharmacistName; }
        public String getTransactionType() { return transactionType; }
        public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public LocalDateTime getTransactionDate() { return transactionDate; }
        public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }
    }
}
