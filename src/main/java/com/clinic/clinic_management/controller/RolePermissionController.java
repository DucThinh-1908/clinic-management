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
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(rolePermissionService.getAllRoles());
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(rolePermissionService.getAllPermissions());
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
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
