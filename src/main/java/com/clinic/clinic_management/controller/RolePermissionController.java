package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.AccountDtos.AssignPermissionsRequest;
import com.clinic.clinic_management.dto.AccountDtos.AssignRolesRequest;
import com.clinic.clinic_management.dto.AuthDtos.UserSummary;
import com.clinic.clinic_management.entity.Permission;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.service.RolePermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/roles-permissions")
public class RolePermissionController {

    @Autowired
    private RolePermissionService rolePermissionService;

    @GetMapping("/roles")
    public ResponseEntity<?> getAllRoles(@RequestParam(required = false) Long requesterId) {
        try {
            return ResponseEntity.ok(rolePermissionService.getAllRoles(requesterId));
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        }
    }

    @GetMapping("/permissions")
    public ResponseEntity<?> getAllPermissions(@RequestParam(required = false) Long requesterId) {
        try {
            return ResponseEntity.ok(rolePermissionService.getAllPermissions(requesterId));
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(err);
        }
    }

    @PutMapping("/users/{userId}/roles")
    public ResponseEntity<?> assignRolesToUser(
            @PathVariable Long userId,
            @RequestBody AssignRolesRequest request,
            @RequestParam(required = false, defaultValue = "1") Long adminId,
            HttpServletRequest servletRequest) {
        try {
            String ipAddress = servletRequest.getRemoteAddr();
            UserSummary updated = rolePermissionService.assignRolesToUser(userId, request.getRoleCodes(), adminId, ipAddress);
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

    @PutMapping("/roles/{roleId}/permissions")
    public ResponseEntity<?> assignPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody AssignPermissionsRequest request,
            @RequestParam(required = false, defaultValue = "1") Long adminId,
            HttpServletRequest servletRequest) {
        try {
            String ipAddress = servletRequest.getRemoteAddr();
            Role updated = rolePermissionService.assignPermissionsToRole(roleId, request.getPermissionCodes(), adminId, ipAddress);
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
}
