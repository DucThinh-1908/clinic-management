package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.AccountDtos.MedicalRecordAccessLogResponse;
import com.clinic.clinic_management.dto.AccountDtos.RecordAccessLogRequest;
import com.clinic.clinic_management.service.RecordAccessLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/access-logs")
public class RecordAccessLogController {

    @Autowired
    private RecordAccessLogService recordAccessLogService;

    @GetMapping("/medical-records")
    public ResponseEntity<?> getMedicalRecordAccessLogs(
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = requesterId;
            if (actorId == null && requesterIdHeader != null && !requesterIdHeader.trim().isEmpty()) {
                try {
                    actorId = Long.parseLong(requesterIdHeader.trim());
                } catch (NumberFormatException ignored) {}
            }
            return ResponseEntity.ok(recordAccessLogService.getMedicalRecordAccessLogs(actorId));
        } catch (SecurityException e) {
            java.util.Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        }
    }

    @PostMapping("/medical-records")
    public ResponseEntity<MedicalRecordAccessLogResponse> logRecordAccess(
            @RequestBody RecordAccessLogRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        MedicalRecordAccessLogResponse logged = recordAccessLogService.logRecordAccess(request, ipAddress);
        return ResponseEntity.ok(logged);
    }
}
