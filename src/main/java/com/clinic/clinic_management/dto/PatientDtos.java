package com.clinic.clinic_management.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PatientDtos {

    public static class CreatePatientRequest {
        private String fullName;
        private String gender;
        private LocalDate dateOfBirth;
        private String phone;
        private String email;
        private String identityCard;
        private String healthInsuranceNumber;
        private String address;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String bloodGroup;
        private String medicalHistory;
        private String drugAllergies;
        private Long userId;

        public CreatePatientRequest() {}

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getIdentityCard() { return identityCard; }
        public void setIdentityCard(String identityCard) { this.identityCard = identityCard; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
        public String getDrugAllergies() { return drugAllergies; }
        public void setDrugAllergies(String drugAllergies) { this.drugAllergies = drugAllergies; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    }

    public static class UpdatePatientRequest {
        private String fullName;
        private String gender;
        private LocalDate dateOfBirth;
        private String phone;
        private String email;
        private String identityCard;
        private String address;
        private String emergencyContactName;
        private String emergencyContactPhone;

        public UpdatePatientRequest() {}

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getIdentityCard() { return identityCard; }
        public void setIdentityCard(String identityCard) { this.identityCard = identityCard; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
    }

    public static class UpdateMedicalHistoryRequest {
        private String medicalHistory;
        private String drugAllergies;
        private String bloodGroup;

        public UpdateMedicalHistoryRequest() {}

        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
        public String getDrugAllergies() { return drugAllergies; }
        public void setDrugAllergies(String drugAllergies) { this.drugAllergies = drugAllergies; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    }

    public static class UpdateInsuranceRequest {
        private String healthInsuranceNumber;

        public UpdateInsuranceRequest() {}

        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
    }

    public static class MergePatientRequest {
        private Long primaryPatientId;
        private Long duplicatePatientId;
        private String note;

        public MergePatientRequest() {}

        public Long getPrimaryPatientId() { return primaryPatientId; }
        public void setPrimaryPatientId(Long primaryPatientId) { this.primaryPatientId = primaryPatientId; }
        public Long getDuplicatePatientId() { return duplicatePatientId; }
        public void setDuplicatePatientId(Long duplicatePatientId) { this.duplicatePatientId = duplicatePatientId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class ToggleActiveRequest {
        private Boolean isActive;
        private String reason;

        public ToggleActiveRequest() {}

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class PatientDetailDto {
        private Long id;
        private Long userId;
        private String patientCode;
        private String fullName;
        private String gender;
        private LocalDate dateOfBirth;
        private Integer age;
        private String phone;
        private String email;
        private String identityCard;
        private String healthInsuranceNumber;
        private String address;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String bloodGroup;
        private String medicalHistory;
        private String drugAllergies;
        private Boolean isActive;
        private Long mergedIntoId;
        private String mergedIntoCode;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private long totalVisits;

        public PatientDetailDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getIdentityCard() { return identityCard; }
        public void setIdentityCard(String identityCard) { this.identityCard = identityCard; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getMedicalHistory() { return medicalHistory; }
        public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
        public String getDrugAllergies() { return drugAllergies; }
        public void setDrugAllergies(String drugAllergies) { this.drugAllergies = drugAllergies; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public Long getMergedIntoId() { return mergedIntoId; }
        public void setMergedIntoId(Long mergedIntoId) { this.mergedIntoId = mergedIntoId; }
        public String getMergedIntoCode() { return mergedIntoCode; }
        public void setMergedIntoCode(String mergedIntoCode) { this.mergedIntoCode = mergedIntoCode; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        public long getTotalVisits() { return totalVisits; }
        public void setTotalVisits(long totalVisits) { this.totalVisits = totalVisits; }
    }

    public static class MedicalRecordSummaryDto {
        private Long id;
        private String recordCode;
        private Long patientId;
        private Long doctorId;
        private String doctorName;
        private String doctorQualification;
        private Long roomId;
        private String roomName;
        private String roomNumber;
        private String chiefComplaint;
        private String historyOfPresentIllness;
        private String physicalExamination;
        private String initialDiagnosis;
        private String finalDiagnosis;
        private String icd10Code;
        private String doctorAdvice;
        private LocalDate followUpDate;
        private String status;
        private LocalDateTime createdAt;

        public MedicalRecordSummaryDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getRecordCode() { return recordCode; }
        public void setRecordCode(String recordCode) { this.recordCode = recordCode; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDoctorQualification() { return doctorQualification; }
        public void setDoctorQualification(String doctorQualification) { this.doctorQualification = doctorQualification; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public String getRoomNumber() { return roomNumber; }
        public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
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
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
