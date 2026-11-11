package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.AccountDtos.CreateAccountRequest;
import com.clinic.clinic_management.dto.AccountDtos.StatusToggleRequest;
import com.clinic.clinic_management.dto.AuthDtos.UserSummary;
import com.clinic.clinic_management.service.AccountManagementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/accounts")
public class AccountManagementController {

    @Autowired
    private AccountManagementService accountManagementService;

    private Long resolveAdminId(Long paramId, String headerId) {
        if (paramId != null) return paramId;
        if (headerId != null && !headerId.trim().isEmpty()) {
            try {
                return Long.parseLong(headerId.trim());
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getAllAccounts(
            @RequestParam(required = false) Long requesterId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader) {
        try {
            Long actorId = resolveAdminId(requesterId, requesterIdHeader);
            return ResponseEntity.ok(accountManagementService.getAllAccounts(actorId));
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAccount(
            @RequestBody CreateAccountRequest request,
            @RequestParam(required = false) Long adminId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long effectiveAdminId = resolveAdminId(adminId, requesterIdHeader);
            if (effectiveAdminId == null) effectiveAdminId = 1L;
            String ipAddress = servletRequest.getRemoteAddr();
            UserSummary created = accountManagementService.createAccount(request, effectiveAdminId, ipAddress);
            return ResponseEntity.ok(created);
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleAccountStatus(
            @PathVariable Long id,
            @RequestBody StatusToggleRequest request,
            @RequestParam(required = false) Long adminId,
            @RequestHeader(value = "X-Requester-Id", required = false) String requesterIdHeader,
            HttpServletRequest servletRequest) {
        try {
            Long effectiveAdminId = resolveAdminId(adminId, requesterIdHeader);
            if (effectiveAdminId == null) effectiveAdminId = 1L;
            String ipAddress = servletRequest.getRemoteAddr();
            UserSummary updated = accountManagementService.toggleAccountStatus(id, request.getIsActive(), request.getReason(), effectiveAdminId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/sync-keycloak")
    public ResponseEntity<?> syncAllFromKeycloak() {
        return ResponseEntity.ok(accountManagementService.syncUsersFromKeycloak());
    }
}
