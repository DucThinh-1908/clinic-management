package com.clinic.clinic_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class MedicalExaminationDtos {

    // =========================================================================
    // UC-KB01: GHI NHẬN SINH HIỆU
    // =========================================================================
    public static class VitalSignRequest {
        private Long patientId;
        private Long nurseId;
        private Long ticketId; // Optional: để gắn với lượt khám
        private BigDecimal temperature;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Integer heartRate;
        private Integer respiratoryRate;
        private BigDecimal spo2;
        private BigDecimal weightKg;
        private BigDecimal heightCm;
        private String notes;

        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getNurseId() { return nurseId; }
        public void setNurseId(Long nurseId) { this.nurseId = nurseId; }
        public Long getTicketId() { return ticketId; }
        public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
        public BigDecimal getTemperature() { return temperature; }
        public void setTemperature(BigDecimal temperature) { this.temperature = temperature; }
        public Integer getBloodPressureSystolic() { return bloodPressureSystolic; }
        public void setBloodPressureSystolic(Integer bloodPressureSystolic) { this.bloodPressureSystolic = bloodPressureSystolic; }
        public Integer getBloodPressureDiastolic() { return bloodPressureDiastolic; }
        public void setBloodPressureDiastolic(Integer bloodPressureDiastolic) { this.bloodPressureDiastolic = bloodPressureDiastolic; }
        public Integer getHeartRate() { return heartRate; }
        public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
        public Integer getRespiratoryRate() { return respiratoryRate; }
        public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }
        public BigDecimal getSpo2() { return spo2; }
        public void setSpo2(BigDecimal spo2) { this.spo2 = spo2; }
        public BigDecimal getWeightKg() { return weightKg; }
        public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
        public BigDecimal getHeightCm() { return heightCm; }
        public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class VitalSignResponse {
        private Long id;
        private Long patientId;
        private String patientName;
        private Long nurseId;
        private String nurseName;
        private BigDecimal temperature;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Integer heartRate;
        private Integer respiratoryRate;
        private BigDecimal spo2;
        private BigDecimal weightKg;
        private BigDecimal heightCm;
        private BigDecimal bmi;
        private String bmiCategory; // Thiếu cân, Bình thường, Thừa cân, Béo phì
        private String bloodPressureStatus; // Bình thường, Tăng huyết áp
        private String temperatureStatus; // Bình thường, Sốt
        private String notes;
        private LocalDateTime measuredAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public Long getNurseId() { return nurseId; }
        public void setNurseId(Long nurseId) { this.nurseId = nurseId; }
        public String getNurseName() { return nurseName; }
        public void setNurseName(String nurseName) { this.nurseName = nurseName; }
        public BigDecimal getTemperature() { return temperature; }
        public void setTemperature(BigDecimal temperature) { this.temperature = temperature; }
        public Integer getBloodPressureSystolic() { return bloodPressureSystolic; }
        public void setBloodPressureSystolic(Integer bloodPressureSystolic) { this.bloodPressureSystolic = bloodPressureSystolic; }
        public Integer getBloodPressureDiastolic() { return bloodPressureDiastolic; }
        public void setBloodPressureDiastolic(Integer bloodPressureDiastolic) { this.bloodPressureDiastolic = bloodPressureDiastolic; }
        public Integer getHeartRate() { return heartRate; }
        public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
        public Integer getRespiratoryRate() { return respiratoryRate; }
        public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }
        public BigDecimal getSpo2() { return spo2; }
        public void setSpo2(BigDecimal spo2) { this.spo2 = spo2; }
        public BigDecimal getWeightKg() { return weightKg; }
        public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
        public BigDecimal getHeightCm() { return heightCm; }
        public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }
        public BigDecimal getBmi() { return bmi; }
        public void setBmi(BigDecimal bmi) { this.bmi = bmi; }
        public String getBmiCategory() { return bmiCategory; }
        public void setBmiCategory(String bmiCategory) { this.bmiCategory = bmiCategory; }
        public String getBloodPressureStatus() { return bloodPressureStatus; }
        public void setBloodPressureStatus(String bloodPressureStatus) { this.bloodPressureStatus = bloodPressureStatus; }
        public String getTemperatureStatus() { return temperatureStatus; }
        public void setTemperatureStatus(String temperatureStatus) { this.temperatureStatus = temperatureStatus; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public LocalDateTime getMeasuredAt() { return measuredAt; }
        public void setMeasuredAt(LocalDateTime measuredAt) { this.measuredAt = measuredAt; }
    }

    // =========================================================================
    // UC-KB02: LỊCH SỬ KHÁM BỆNH
    // =========================================================================
    public static class MedicalRecordSummaryDto {
        private Long id;
        private String recordCode;
        private Long patientId;
        private String patientName;
        private Long doctorId;
        private String doctorName;
        private Long roomId;
        private String roomName;
        private String chiefComplaint;
        private String initialDiagnosis;
        private String finalDiagnosis;
        private String icd10Code;
        private String doctorAdvice;
        private LocalDate followUpDate;
        private String status;
        private LocalDateTime createdAt;
        private VitalSignResponse vitalSigns;
        private List<LabOrderSummaryDto> labOrders;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
        public String getInitialDiagnosis() { return initialDiagnosis; }
        public void setInitialDiagnosis(String initialDiagnosis) { this.initialDiagnosis = initialDiagnosis; }
        public String getFinalDiagnosis() { return finalDiagnosis; }
        public void setFinalDiagnosis(String finalDiagnosis) { this.finalDiagnosis = finalDiagnosis; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public VitalSignResponse getVitalSigns() { return vitalSigns; }
        public void setVitalSigns(VitalSignResponse vitalSigns) { this.vitalSigns = vitalSigns; }
        public List<LabOrderSummaryDto> getLabOrders() { return labOrders; }
        public void setLabOrders(List<LabOrderSummaryDto> labOrders) { this.labOrders = labOrders; }
    }

    // =========================================================================
    // UC-KB03: GHI TRIỆU CHỨNG & CHẨN ĐOÁN
    // =========================================================================
    public static class SaveDiagnosisRequest {
        private Long medicalRecordId; // Nếu null sẽ tạo mới phiên khám
        private Long ticketId; // Nếu có số thứ tự hàng đợi
        private Long patientId;
        private Long doctorId;
        private Long roomId;
        private Long appointmentId;
        private Long vitalSignsId;
        private String chiefComplaint;
        private String historyOfPresentIllness;
        private String physicalExamination;
        private String initialDiagnosis;
        private String finalDiagnosis;
        private String icd10Code;
        private String doctorAdvice;
        private LocalDate followUpDate;
        private String status; // IN_PROGRESS, WAITING_PARACLINICAL, COMPLETED

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getTicketId() { return ticketId; }
        public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        public Long getVitalSignsId() { return vitalSignsId; }
        public void setVitalSignsId(Long vitalSignsId) { this.vitalSignsId = vitalSignsId; }
        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
        public String getHistoryOfPresentIllness() { return historyOfPresentIllness; }
        public void setHistoryOfPresentIllness(String historyOfPresentIllness) { this.historyOfPresentIllness = historyOfPresentIllness; }
        public String getPhysicalExamination() { return physicalExamination; }
        public void setPhysicalExamination(String physicalExamination) { this.physicalExamination = physicalExamination; }
        public String getInitialDiagnosis() { return initialDiagnosis; }
        public void setInitialDiagnosis(String initialDiagnosis) { this.initialDiagnosis = initialDiagnosis; }
        public String getFinalDiagnosis() { return finalDiagnosis; }
        public void setFinalDiagnosis(String finalDiagnosis) { this.finalDiagnosis = finalDiagnosis; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // =========================================================================
    // UC-KB04 & UC-KB05: CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG & XEM KẾT QUẢ
    // =========================================================================
    public static class OrderLabServicesRequest {
        private Long medicalRecordId;
        private Long doctorId;
        private Long patientId;
        private String diagnosisNote;
        private List<Long> serviceIds;

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getDiagnosisNote() { return diagnosisNote; }
        public void setDiagnosisNote(String diagnosisNote) { this.diagnosisNote = diagnosisNote; }
        public List<Long> getServiceIds() { return serviceIds; }
        public void setServiceIds(List<Long> serviceIds) { this.serviceIds = serviceIds; }
    }

    public static class LabOrderSummaryDto {
        private Long id;
        private String orderCode;
        private Long medicalRecordId;
        private Long doctorId;
        private String doctorName;
        private Long patientId;
        private String patientName;
        private String diagnosisNote;
        private String status;
        private LocalDateTime createdAt;
        private List<LabResultItemDto> items;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getOrderCode() { return orderCode; }
        public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
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
        public String getDiagnosisNote() { return diagnosisNote; }
        public void setDiagnosisNote(String diagnosisNote) { this.diagnosisNote = diagnosisNote; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public List<LabResultItemDto> getItems() { return items; }
        public void setItems(List<LabResultItemDto> items) { this.items = items; }
    }

    public static class LabResultItemDto {
        private Long id;
        private Long labOrderId;
        private Long serviceId;
        private String serviceCode;
        private String serviceName;
        private String categoryName;
        private BigDecimal price;
        private Long technicianId;
        private String technicianName;
        private Long roomId;
        private String roomName;
        private String testValue;
        private String referenceRange;
        private String unit;
        private String conclusion;
        private String imageAttachmentUrl;
        private String status;
        private LocalDateTime completedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getLabOrderId() { return labOrderId; }
        public void setLabOrderId(Long labOrderId) { this.labOrderId = labOrderId; }
        public Long getServiceId() { return serviceId; }
        public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
        public String getServiceCode() { return serviceCode; }
        public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public String getTechnicianName() { return technicianName; }
        public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public String getTestValue() { return testValue; }
        public void setTestValue(String testValue) { this.testValue = testValue; }
        public String getReferenceRange() { return referenceRange; }
        public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getConclusion() { return conclusion; }
        public void setConclusion(String conclusion) { this.conclusion = conclusion; }
        public String getImageAttachmentUrl() { return imageAttachmentUrl; }
        public void setImageAttachmentUrl(String imageAttachmentUrl) { this.imageAttachmentUrl = imageAttachmentUrl; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }

    public static class UpdateLabResultRequest {
        private Long resultId;
        private Long technicianId;
        private String testValue;
        private String referenceRange;
        private String unit;
        private String conclusion;
        private String imageAttachmentUrl;

        public Long getResultId() { return resultId; }
        public void setResultId(Long resultId) { this.resultId = resultId; }
        public Long getTechnicianId() { return technicianId; }
        public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
        public String getTestValue() { return testValue; }
        public void setTestValue(String testValue) { this.testValue = testValue; }
        public String getReferenceRange() { return referenceRange; }
        public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getConclusion() { return conclusion; }
        public void setConclusion(String conclusion) { this.conclusion = conclusion; }
        public String getImageAttachmentUrl() { return imageAttachmentUrl; }
        public void setImageAttachmentUrl(String imageAttachmentUrl) { this.imageAttachmentUrl = imageAttachmentUrl; }
    }

    // =========================================================================
    // UC-KB06: HẸN TÁI KHÁM
    // =========================================================================
    public static class ScheduleFollowUpRequest {
        private Long medicalRecordId;
        private LocalDate followUpDate;
        private String doctorAdvice;

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
    }

    // =========================================================================
    // UC-KB07: KẾT THÚC PHIÊN KHÁM
    // =========================================================================
    public static class CompleteEncounterRequest {
        private Long medicalRecordId;
        private Long ticketId; // Optional: số thứ tự hàng đợi
        private Long patientId;
        private Long doctorId;
        private Long roomId;
        private String chiefComplaint;
        private String finalDiagnosis;
        private String icd10Code;
        private String doctorAdvice;
        private LocalDate followUpDate;

        public Long getMedicalRecordId() { return medicalRecordId; }
        public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }
        public Long getTicketId() { return ticketId; }
        public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
        public String getFinalDiagnosis() { return finalDiagnosis; }
        public void setFinalDiagnosis(String finalDiagnosis) { this.finalDiagnosis = finalDiagnosis; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
    }

    // =========================================================================
    // UC-KB08: IN PHIẾU KHÁM / TÓM TẮT BỆNH ÁN
    // =========================================================================
    public static class MedicalSummaryPrintDto {
        private String clinicName = "PHÒNG KHÁM ĐA KHOA QUỐC TẾ CAREPLUS";
        private String clinicAddress = "Số 123 Đường Giải Phóng, Quận Đống Đa, Hà Nội";
        private String clinicHotline = "1900 6868 - (024) 3822 5588";

        // Hồ sơ
        private Long recordId;
        private String recordCode;
        private LocalDateTime examinationDate;
        private String roomName;
        private String departmentName;
        private String doctorName;
        private String doctorQualification;

        // Bệnh nhân
        private Long patientId;
        private String patientCode;
        private String patientName;
        private String gender;
        private LocalDate dateOfBirth;
        private Integer age;
        private String phone;
        private String address;
        private String healthInsuranceNumber;
        private String bloodGroup;
        private String drugAllergies;

        // Sinh hiệu
        private VitalSignResponse vitalSigns;

        // Khám lâm sàng
        private String chiefComplaint;
        private String historyOfPresentIllness;
        private String physicalExamination;

        // Chẩn đoán
        private String initialDiagnosis;
        private String finalDiagnosis;
        private String icd10Code;

        // Cận lâm sàng & Kết quả
        private List<LabOrderSummaryDto> labOrders;

        // Dặn dò & Tái khám
        private String doctorAdvice;
        private LocalDate followUpDate;
        private String status;

        public String getClinicName() { return clinicName; }
        public void setClinicName(String clinicName) { this.clinicName = clinicName; }
        public String getClinicAddress() { return clinicAddress; }
        public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
        public String getClinicHotline() { return clinicHotline; }
        public void setClinicHotline(String clinicHotline) { this.clinicHotline = clinicHotline; }
        public Long getRecordId() { return recordId; }
        public void setRecordId(Long recordId) { this.recordId = recordId; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public LocalDateTime getExaminationDate() { return examinationDate; }
        public void setExaminationDate(LocalDateTime examinationDate) { this.examinationDate = examinationDate; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDoctorQualification() { return doctorQualification; }
        public void setDoctorQualification(String doctorQualification) { this.doctorQualification = doctorQualification; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getDrugAllergies() { return drugAllergies; }
        public void setDrugAllergies(String drugAllergies) { this.drugAllergies = drugAllergies; }
        public VitalSignResponse getVitalSigns() { return vitalSigns; }
        public void setVitalSigns(VitalSignResponse vitalSigns) { this.vitalSigns = vitalSigns; }
        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
        public String getHistoryOfPresentIllness() { return historyOfPresentIllness; }
        public void setHistoryOfPresentIllness(String historyOfPresentIllness) { this.historyOfPresentIllness = historyOfPresentIllness; }
        public String getPhysicalExamination() { return physicalExamination; }
        public void setPhysicalExamination(String physicalExamination) { this.physicalExamination = physicalExamination; }
        public String getInitialDiagnosis() { return initialDiagnosis; }
        public void setInitialDiagnosis(String initialDiagnosis) { this.initialDiagnosis = initialDiagnosis; }
        public String getFinalDiagnosis() { return finalDiagnosis; }
        public void setFinalDiagnosis(String finalDiagnosis) { this.finalDiagnosis = finalDiagnosis; }
        public String getIcd10Code() { return icd10Code; }
        public void setIcd10Code(String icd10Code) { this.icd10Code = icd10Code; }
        public List<LabOrderSummaryDto> getLabOrders() { return labOrders; }
        public void setLabOrders(List<LabOrderSummaryDto> labOrders) { this.labOrders = labOrders; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
        public LocalDate getFollowUpDate() { return followUpDate; }
        public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
