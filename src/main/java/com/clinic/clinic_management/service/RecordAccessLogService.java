package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AccountDtos.MedicalRecordAccessLogResponse;
import com.clinic.clinic_management.dto.AccountDtos.RecordAccessLogRequest;
import com.clinic.clinic_management.entity.AuditLog;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.entity.User;
import com.clinic.clinic_management.repository.AuditLogRepository;
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

    public List<MedicalRecordAccessLogResponse> getMedicalRecordAccessLogs() {
        List<AuditLog> logs = auditLogRepository.findByEntityNameOrderByCreatedAtDesc("medical_records");
        List<MedicalRecordAccessLogResponse> responses = new ArrayList<>();

        for (AuditLog log : logs) {
            MedicalRecordAccessLogResponse res = new MedicalRecordAccessLogResponse();
            res.setId(log.getId());
            res.setUserId(log.getUserId());
            res.setAction(log.getAction());
            res.setRecordCode(log.getEntityId() != null ? log.getEntityId() : "HSBA-Chung");
            res.setIpAddress(log.getIpAddress());
            res.setCreatedAt(log.getCreatedAt());

            // Extract patientName and reason from newData json string if present
            String data = log.getNewData();
            if (data != null) {
                if (data.contains("\"patientName\":\"")) {
                    int start = data.indexOf("\"patientName\":\"") + 15;
                    int end = data.indexOf("\"", start);
                    if (end > start) res.setPatientName(data.substring(start, end));
                }
                if (data.contains("\"reason\":\"")) {
                    int start = data.indexOf("\"reason\":\"") + 10;
                    int end = data.indexOf("\"", start);
                    if (end > start) res.setReason(data.substring(start, end));
                }
            }

            if (res.getPatientName() == null) res.setPatientName("Hồ sơ bệnh án tổng quát");
            if (res.getReason() == null) res.setReason("Tra cứu thông tin lâm sàng");

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
