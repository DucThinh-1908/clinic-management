package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AccountDtos.CreateAccountRequest;
import com.clinic.clinic_management.dto.AuthDtos.UserSummary;
import com.clinic.clinic_management.entity.AuditLog;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.entity.User;
import com.clinic.clinic_management.repository.AuditLogRepository;
import com.clinic.clinic_management.repository.RoleRepository;
import com.clinic.clinic_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AccountManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuthService authService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<UserSummary> getAllAccounts() {
        return userRepository.findAll().stream()
                .map(authService::toUserSummary)
                .collect(Collectors.toList());
    }

    public List<UserSummary> getAllAccounts(Long requesterId) {
        if (requesterId != null) {
            authService.validateAdminOrManager(requesterId);
        }
        return getAllAccounts();
    }

    @Transactional
    public UserSummary createAccount(CreateAccountRequest request, Long adminId, String ipAddress) {
        authService.validateAdminOrManager(adminId);
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên đăng nhập không được để trống.");
        }
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new IllegalArgumentException("Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng.");
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' đã được sử dụng.");
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty() && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new IllegalArgumentException("Số điện thoại '" + request.getPhone() + "' đã được sử dụng.");
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().trim().isEmpty()
                ? request.getPassword()
                : "123456";

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setIsActive(true);
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        if (request.getRoleCodes() != null && !request.getRoleCodes().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String code : request.getRoleCodes()) {
                roleRepository.findByCode(code).ifPresent(roles::add);
            }
            user.setRoles(roles);
        } else {
            roleRepository.findByCode("patient").ifPresent(r -> user.getRoles().add(r));
        }

        User savedUser = userRepository.save(user);

        AuditLog log = new AuditLog(adminId, "CREATE_USER", "users", String.valueOf(savedUser.getId()),
                "{\"username\":\"" + savedUser.getUsername() + "\",\"roles\":\"" + request.getRoleCodes() + "\"}", ipAddress);
        auditLogRepository.save(log);

        return authService.toUserSummary(savedUser);
    }

    @Transactional
    public UserSummary toggleAccountStatus(Long userId, Boolean isActive, String reason, Long adminId, String ipAddress) {
        authService.validateAdminOrManager(adminId);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với ID: " + userId);
        }

        User user = userOpt.get();

        // Kiểm tra ràng buộc khi khóa tài khoản
        if (Boolean.FALSE.equals(isActive)) {
            // 1. Không thể tự khóa tài khoản của chính mình
            if (adminId != null && adminId.equals(userId)) {
                throw new IllegalArgumentException("Bạn không thể tự khóa tài khoản của chính mình.");
            }

            // 2. Manager không có quyền khóa tài khoản của Admin
            if (adminId != null) {
                User requester = userRepository.findById(adminId).orElse(null);
                if (requester != null && requester.getRoles() != null) {
                    boolean requesterIsManager = requester.getRoles().stream()
                            .anyMatch(r -> "manager".equalsIgnoreCase(r.getCode()))
                            && requester.getRoles().stream().noneMatch(r -> "admin".equalsIgnoreCase(r.getCode()));

                    boolean targetIsAdmin = user.getRoles() != null && user.getRoles().stream()
                            .anyMatch(r -> "admin".equalsIgnoreCase(r.getCode()));

                    if (requesterIsManager && targetIsAdmin) {
                        throw new IllegalArgumentException("Quản lý không có quyền khóa tài khoản của Quản trị viên (Admin).");
                    }
                }
            }
        }

        user.setIsActive(isActive);
        user.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(user);

        String action = Boolean.TRUE.equals(isActive) ? "UNLOCK_USER" : "LOCK_USER";
        AuditLog log = new AuditLog(adminId, action, "users", String.valueOf(userId),
                "{\"targetUser\":\"" + user.getUsername() + "\",\"isActive\":" + isActive + ",\"reason\":\"" + (reason != null ? reason : "") + "\"}", ipAddress);
        auditLogRepository.save(log);

        return authService.toUserSummary(updated);
    }
}
