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
    public ResponseEntity<List<MedicalRecordAccessLogResponse>> getMedicalRecordAccessLogs() {
        return ResponseEntity.ok(recordAccessLogService.getMedicalRecordAccessLogs());
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
