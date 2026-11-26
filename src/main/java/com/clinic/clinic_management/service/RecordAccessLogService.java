package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AccountDtos.MedicalRecordAccessLogResponse;
import com.clinic.clinic_management.dto.AccountDtos.RecordAccessLogRequest;
import com.clinic.clinic_management.entity.AuditLog;
import com.clinic.clinic_management.entity.Patient;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.entity.User;
import com.clinic.clinic_management.repository.AuditLogRepository;
import com.clinic.clinic_management.repository.PatientRepository;
import com.clinic.clinic_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RecordAccessLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AuthService authService;

    public List<MedicalRecordAccessLogResponse> getMedicalRecordAccessLogs() {
        return getMedicalRecordAccessLogs(null);
    }

    public List<MedicalRecordAccessLogResponse> getMedicalRecordAccessLogs(Long requesterId) {
        if (requesterId != null) {
            authService.validateAdminOrManager(requesterId);
        }
        List<AuditLog> logs = auditLogRepository.findByEntityNameInOrderByCreatedAtDesc(List.of("medical_records", "patients"));
        List<MedicalRecordAccessLogResponse> responses = new ArrayList<>();

        for (AuditLog log : logs) {
            MedicalRecordAccessLogResponse res = new MedicalRecordAccessLogResponse();
            res.setId(log.getId());
            res.setUserId(log.getUserId());
            res.setAction(log.getAction());
            res.setIpAddress(log.getIpAddress() != null ? log.getIpAddress() : "127.0.0.1");
            res.setCreatedAt(log.getCreatedAt());

            String data = log.getNewData();
            String patientName = null;
            String reason = null;
            String recordCode = null;

            if (data != null) {
                if (data.contains("\"patientName\":\"")) {
                    int start = data.indexOf("\"patientName\":\"") + 15;
                    int end = data.indexOf("\"", start);
                    if (end > start) patientName = data.substring(start, end);
                }
                if (data.contains("\"fullName\":\"")) {
                    int start = data.indexOf("\"fullName\":\"") + 12;
                    int end = data.indexOf("\"", start);
                    if (end > start) patientName = data.substring(start, end);
                }
                if (data.contains("\"reason\":\"")) {
                    int start = data.indexOf("\"reason\":\"") + 10;
                    int end = data.indexOf("\"", start);
                    if (end > start) reason = data.substring(start, end);
                }
                if (data.contains("\"patientCode\":\"")) {
                    int start = data.indexOf("\"patientCode\":\"") + 15;
                    int end = data.indexOf("\"", start);
                    if (end > start) recordCode = data.substring(start, end);
                } else if (data.contains("\"primaryCode\":\"")) {
                    int start = data.indexOf("\"primaryCode\":\"") + 15;
                    int end = data.indexOf("\"", start);
                    if (end > start) recordCode = data.substring(start, end);
                }
            }

            // Fallback tra cứu thông tin bệnh nhân nếu là entity 'patients'
            if ("patients".equalsIgnoreCase(log.getEntityName()) && log.getEntityId() != null) {
                try {
                    Long pid = Long.parseLong(log.getEntityId());
                    Optional<Patient> pOpt = patientRepository.findById(pid);
                    if (pOpt.isPresent()) {
                        Patient p = pOpt.get();
                        if (patientName == null) patientName = p.getFullName();
                        if (recordCode == null) recordCode = p.getPatientCode();
                    }
                } catch (NumberFormatException ignored) {}
            }

            if (recordCode == null) {
                recordCode = log.getEntityId() != null ? log.getEntityId() : "HSBA-Chung";
            }
            res.setRecordCode(recordCode);

            // Gán mô tả lý do thao tác rõ ràng theo từng hành vi
            if (reason == null || reason.trim().isEmpty()) {
                String act = log.getAction() != null ? log.getAction() : "";
                switch (act) {
                    case "VIEW_RECORD":
                        reason = "Tra cứu xem lịch sử khám bệnh";
                        break;
                    case "CREATE_PATIENT":
                        reason = "Đăng ký tiếp nhận hồ sơ bệnh nhân mới";
                        break;
                    case "UPDATE_PATIENT_INFO":
                    case "SELF_UPDATE_PATIENT_INFO":
                        reason = "Cập nhật thông tin hành chính bệnh nhân";
                        break;
                    case "UPDATE_MEDICAL_HISTORY":
                        reason = "Cập nhật tiền sử bệnh lý và dị ứng thuốc";
                        break;
                    case "UPDATE_HEALTH_INSURANCE":
                        reason = "Cập nhật thông tin thẻ bảo hiểm y tế (BHYT)";
                        break;
                    case "MERGE_PATIENTS":
                        reason = "Gộp hồ sơ bệnh nhân trùng lặp";
                        break;
                    case "DEACTIVATE_PATIENT":
                        reason = "Khóa / Vô hiệu hóa hồ sơ bệnh nhân";
                        break;
                    case "ACTIVATE_PATIENT":
                        reason = "Mở khóa / Kích hoạt lại hồ sơ bệnh nhân";
                        break;
                    case "EDIT_RECORD":
                        reason = "Chỉnh sửa thông tin hồ sơ bệnh án";
                        break;
                    case "PRINT_RECORD":
                        reason = "In sao lưu / Trích xuất hồ sơ bệnh án";
                        break;
                    default:
                        reason = "Thao tác trên hồ sơ bệnh nhân";
                }
            }

            res.setPatientName(patientName != null ? patientName : "Hồ sơ bệnh nhân");
            res.setReason(reason);

            if (log.getUserId() != null) {
                Optional<User> uOpt = userRepository.findById(log.getUserId());
                if (uOpt.isPresent()) {
                    User u = uOpt.get();
                    res.setUsername(u.getUsername());
                    String rolesStr = u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", "));
                    res.setRoleName(rolesStr.isEmpty() ? "Nhân viên y tế" : rolesStr);
                } else {
                    res.setUsername("User #" + log.getUserId());
                    res.setRoleName("Nhân sự");
                }
            } else {
                res.setUsername("Hệ thống tự động");
                res.setRoleName("Hệ thống");
            }

            responses.add(res);
        }
        return responses;
    }

    @Transactional
    public MedicalRecordAccessLogResponse logRecordAccess(RecordAccessLogRequest request, String ipAddress) {
        String jsonPayload = String.format("{\"patientName\":\"%s\",\"reason\":\"%s\"}",
                request.getPatientName() != null ? request.getPatientName() : "Bệnh nhân",
                request.getReason() != null ? request.getReason() : "Thăm khám điều trị");

        String action = request.getAction() != null ? request.getAction() : "VIEW_RECORD";
        String recordCode = request.getRecordCode() != null ? request.getRecordCode() : "HSBA-2026-0001";

        AuditLog log = new AuditLog(request.getUserId(), action, "medical_records", recordCode, jsonPayload, ipAddress);
        AuditLog saved = auditLogRepository.save(log);

        MedicalRecordAccessLogResponse res = new MedicalRecordAccessLogResponse();
        res.setId(saved.getId());
        res.setUserId(saved.getUserId());
        res.setAction(saved.getAction());
        res.setRecordCode(recordCode);
        res.setPatientName(request.getPatientName());
        res.setReason(request.getReason());
        res.setIpAddress(ipAddress);
        res.setCreatedAt(saved.getCreatedAt());

        if (request.getUserId() != null) {
            userRepository.findById(request.getUserId()).ifPresent(u -> {
                res.setUsername(u.getUsername());
                res.setRoleName(u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", ")));
            });
        }
        return res;
    }
}
