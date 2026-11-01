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

    @GetMapping
    public ResponseEntity<List<UserSummary>> getAllAccounts() {
        return ResponseEntity.ok(accountManagementService.getAllAccounts());
    }

    @PostMapping
    public ResponseEntity<?> createAccount(
            @RequestBody CreateAccountRequest request,
            @RequestParam(required = false, defaultValue = "1") Long adminId,
            HttpServletRequest servletRequest) {
        try {
            String ipAddress = servletRequest.getRemoteAddr();
            UserSummary created = accountManagementService.createAccount(request, adminId, ipAddress);
            return ResponseEntity.ok(created);
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
            @RequestParam(required = false, defaultValue = "1") Long adminId,
            HttpServletRequest servletRequest) {
        try {
            String ipAddress = servletRequest.getRemoteAddr();
            UserSummary updated = accountManagementService.toggleAccountStatus(id, request.getIsActive(), request.getReason(), adminId, ipAddress);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
