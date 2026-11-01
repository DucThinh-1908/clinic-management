package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.PatientDtos.*;
import com.clinic.clinic_management.service.PatientManagementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientManagementService patientManagementService;

    private Long resolveRequesterId(Long requesterIdParam, String requesterIdHeader) {
        if (requesterIdParam != null) return requesterIdParam;
        if (requesterIdHeader != null && !requesterIdHeader.trim().isEmpty()) {
            try {
                return Long.parseLong(requesterIdHeader.trim());
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    /**
     * UC-BN01: Đăng ký hồ sơ bệnh nhân mới
     */
    @PostMapping
    public ResponseEntity<?> createPatient(
            @RequestBody CreatePatientRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto created = patientManagementService.createPatient(request, actorId, ipAddress);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi khi tạo hồ sơ bệnh nhân: " + e.getMessage());
        }
    }

    /**
     * UC-BN02: Tìm kiếm hồ sơ bệnh nhân
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchPatients(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            List<PatientDetailDto> results = patientManagementService.searchPatients(keyword, activeOnly, actorId);
            return ResponseEntity.ok(results);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi tìm kiếm: " + e.getMessage());
        }
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientById(
            @PathVariable Long id,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            PatientDetailDto detail = patientManagementService.getPatientById(id, actorId);
            return ResponseEntity.ok(detail);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            return errorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi lấy thông tin: " + e.getMessage());
        }
    }

    /**
     * Lấy hồ sơ bệnh nhân của người dùng đang đăng nhập
     */
    @GetMapping("/profile/me")
    public ResponseEntity<?> getMyProfile(
            @RequestParam(required = false) Long userId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = resolveRequesterId(userId, requesterIdHeader);
            if (actorId == null) {
                return errorResponse(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để xem hồ sơ cá nhân.");
            }
            Optional<PatientDetailDto> myProfile = patientManagementService.getMyPatientProfile(actorId);
            if (myProfile.isEmpty()) {
                Map<String, Object> res = new HashMap<>();
                res.put("exists", false);
                res.put("message", "Chưa có hồ sơ bệnh nhân nào liên kết với tài khoản này.");
                return ResponseEntity.ok(res);
            }
            return ResponseEntity.ok(myProfile.get());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi truy vấn hồ sơ: " + e.getMessage());
        }
    }

    /**
     * UC-BN03: Cập nhật thông tin hành chính bệnh nhân
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePatient(
            @PathVariable Long id,
            @RequestBody UpdatePatientRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto updated = patientManagementService.updatePatient(id, request, actorId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi cập nhật: " + e.getMessage());
        }
    }

    /**
     * UC-BN04: Quản lý tiền sử bệnh và dị ứng (Bác sĩ)
     */
    @PutMapping("/{id}/medical-history")
    public ResponseEntity<?> updateMedicalHistory(
            @PathVariable Long id,
            @RequestBody UpdateMedicalHistoryRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto updated = patientManagementService.updateMedicalHistory(id, request, actorId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi cập nhật tiền sử: " + e.getMessage());
        }
    }

    /**
     * UC-BN05: Cập nhật thông tin bảo hiểm y tế (Lễ tân)
     */
    @PutMapping("/{id}/insurance")
    public ResponseEntity<?> updateInsurance(
            @PathVariable Long id,
            @RequestBody UpdateInsuranceRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto updated = patientManagementService.updateInsurance(id, request, actorId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi cập nhật BHYT: " + e.getMessage());
        }
    }

    /**
     * UC-BN06: Xem lịch sử khám bệnh
     */
    @GetMapping("/{id}/medical-records")
    public ResponseEntity<?> getMedicalRecords(
            @PathVariable Long id,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            List<MedicalRecordSummaryDto> records = patientManagementService.getPatientMedicalRecords(id, actorId);
            return ResponseEntity.ok(records);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            return errorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi xem lịch sử khám: " + e.getMessage());
        }
    }

    /**
     * UC-BN07: Gộp hồ sơ trùng (Quản lý)
     */
    @PostMapping("/merge")
    public ResponseEntity<?> mergePatients(
            @RequestBody MergePatientRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto merged = patientManagementService.mergePatients(request, actorId, ipAddress);
            return ResponseEntity.ok(merged);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi gộp hồ sơ: " + e.getMessage());
        }
    }

    /**
     * UC-BN07: Vô hiệu hóa / Kích hoạt lại hồ sơ bệnh nhân (Quản lý)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> togglePatientStatus(
            @PathVariable Long id,
            @RequestBody ToggleActiveRequest request,
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long actorId = resolveRequesterId(requesterId, requesterIdHeader);
            String ipAddress = servletRequest.getRemoteAddr();
            PatientDetailDto updated = patientManagementService.togglePatientActive(id, request, actorId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return errorResponse(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return errorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi cập nhật trạng thái: " + e.getMessage());
        }
    }

    private ResponseEntity<?> errorResponse(HttpStatus status, String message) {
        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("message", message);
        return ResponseEntity.status(status).body(err);
    }
}
