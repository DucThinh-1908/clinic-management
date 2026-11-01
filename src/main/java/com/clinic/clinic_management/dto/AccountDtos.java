package com.clinic.clinic_management.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class AccountDtos {

    public static class CreateAccountRequest {
        private String username;
        private String password;
        private String email;
        private String phone;
        private Set<String> roleCodes;

        public CreateAccountRequest() {}

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public Set<String> getRoleCodes() {
            return roleCodes;
        }

        public void setRoleCodes(Set<String> roleCodes) {
            this.roleCodes = roleCodes;
        }
    }

    public static class StatusToggleRequest {
        private Boolean isActive;
        private String reason;

        public StatusToggleRequest() {}

        public Boolean getIsActive() {
            return isActive;
        }

        public void setIsActive(Boolean isActive) {
            this.isActive = isActive;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class AssignRolesRequest {
        private Set<String> roleCodes;

        public AssignRolesRequest() {}

        public Set<String> getRoleCodes() {
            return roleCodes;
        }

        public void setRoleCodes(Set<String> roleCodes) {
            this.roleCodes = roleCodes;
        }
    }

    public static class AssignPermissionsRequest {
        private Set<String> permissionCodes;

        public AssignPermissionsRequest() {}

        public Set<String> getPermissionCodes() {
            return permissionCodes;
        }

        public void setPermissionCodes(Set<String> permissionCodes) {
            this.permissionCodes = permissionCodes;
        }
    }

    public static class RecordAccessLogRequest {
        private Long userId;
        private String recordCode;
        private String patientName;
        private String action;
        private String reason;

        public RecordAccessLogRequest() {}

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getRecordCode() {
            return recordCode;
        }

        public void setRecordCode(String recordCode) {
            this.recordCode = recordCode;
        }

        public String getPatientName() {
            return patientName;
        }

        public void setPatientName(String patientName) {
            this.patientName = patientName;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class MedicalRecordAccessLogResponse {
        private Long id;
        private Long userId;
        private String username;
        private String roleName;
        private String action;
        private String recordCode;
        private String patientName;
        private String reason;
        private String ipAddress;
        private LocalDateTime createdAt;

        public MedicalRecordAccessLogResponse() {}

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getRoleName() {
            return roleName;
        }

        public void setRoleName(String roleName) {
            this.roleName = roleName;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getRecordCode() {
            return recordCode;
        }

        public void setRecordCode(String recordCode) {
            this.recordCode = recordCode;
        }

        public String getPatientName() {
            return patientName;
        }

        public void setPatientName(String patientName) {
            this.patientName = patientName;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public void setIpAddress(String ipAddress) {
            this.ipAddress = ipAddress;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
