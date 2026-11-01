package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AuthDtos.UserSummary;
import com.clinic.clinic_management.entity.AuditLog;
import com.clinic.clinic_management.entity.Permission;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.entity.User;
import com.clinic.clinic_management.repository.AuditLogRepository;
import com.clinic.clinic_management.repository.PermissionRepository;
import com.clinic.clinic_management.repository.RoleRepository;
import com.clinic.clinic_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class RolePermissionService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuthService authService;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<Role> getAllRoles(Long requesterId) {
        if (requesterId != null) {
            authService.validateAdminOrManager(requesterId);
        }
        return getAllRoles();
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public List<Permission> getAllPermissions(Long requesterId) {
        if (requesterId != null) {
            authService.validateAdminOrManager(requesterId);
        }
        return getAllPermissions();
    }

    @Transactional
    public UserSummary assignRolesToUser(Long userId, Set<String> roleCodes, Long adminId, String ipAddress) {
        authService.validateAdminOrManager(adminId);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId);
        }

        User user = userOpt.get();
        Set<Role> roles = new HashSet<>();
        if (roleCodes != null) {
            for (String code : roleCodes) {
                roleRepository.findByCode(code).ifPresent(roles::add);
            }
        }
        user.setRoles(roles);
        user.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(user);

        AuditLog log = new AuditLog(adminId, "ASSIGN_ROLES", "users", String.valueOf(userId),
                "{\"targetUser\":\"" + user.getUsername() + "\",\"roles\":\"" + roleCodes + "\"}", ipAddress);
        auditLogRepository.save(log);

        return authService.toUserSummary(updated);
    }

    @Transactional
    public Role assignPermissionsToRole(Long roleId, Set<String> permissionCodes, Long adminId, String ipAddress) {
        authService.validateAdminOrManager(adminId);
        Optional<Role> roleOpt = roleRepository.findById(roleId);
        if (roleOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy vai trò với ID: " + roleId);
        }

        Role role = roleOpt.get();
        Set<Permission> permissions = new HashSet<>();
        if (permissionCodes != null) {
            for (String code : permissionCodes) {
                permissionRepository.findByCode(code).ifPresent(permissions::add);
            }
        }
        role.setPermissions(permissions);
        role.setUpdatedAt(LocalDateTime.now());
        Role updated = roleRepository.save(role);

        AuditLog log = new AuditLog(adminId, "ASSIGN_PERMISSIONS", "roles", String.valueOf(roleId),
                "{\"role\":\"" + role.getCode() + "\",\"permissionsCount\":" + permissions.size() + "}", ipAddress);
        auditLogRepository.save(log);

        return updated;
    }
}
