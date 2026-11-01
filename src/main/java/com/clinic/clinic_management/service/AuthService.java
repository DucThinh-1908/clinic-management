package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AuthDtos.*;
import com.clinic.clinic_management.entity.AuditLog;
import com.clinic.clinic_management.entity.PasswordResetToken;
import com.clinic.clinic_management.entity.Role;
import com.clinic.clinic_management.entity.User;
import com.clinic.clinic_management.repository.AuditLogRepository;
import com.clinic.clinic_management.repository.PasswordResetTokenRepository;
import com.clinic.clinic_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress) {
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        Optional<User> userOpt = userRepository.findByUsername(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "Tên đăng nhập, email hoặc số điện thoại không tồn tại trong hệ thống.", null, null);
        }

        User user = userOpt.get();

        if (Boolean.FALSE.equals(user.getIsActive())) {
            return new LoginResponse(false, "Tài khoản này đã bị khóa bởi Quản trị viên. Vui lòng liên hệ ban quản trị để được hỗ trợ.", null, null);
        }

        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash())
                || request.getPassword().equals(user.getPasswordHash());

        if (!passwordMatches) {
            return new LoginResponse(false, "Mật khẩu không chính xác. Vui lòng kiểm tra lại.", null, null);
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Audit log
        AuditLog log = new AuditLog(user.getId(), "LOGIN", "users", String.valueOf(user.getId()), "{\"status\":\"SUCCESS\"}", ipAddress);
        auditLogRepository.save(log);

        UserSummary summary = toUserSummary(user);
        String mockToken = "CLINIC-AUTH-TOKEN-" + UUID.randomUUID().toString();

        return new LoginResponse(true, "Đăng nhập thành công", mockToken, summary);
    }

    @Transactional
    public boolean logout(Long userId, String ipAddress) {
        if (userId != null) {
            AuditLog log = new AuditLog(userId, "LOGOUT", "users", String.valueOf(userId), "{\"status\":\"LOGGED_OUT\"}", ipAddress);
            auditLogRepository.save(log);
        }
        return true;
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request, String ipAddress) {
        if (request.getUserId() == null) {
            return "Mã người dùng không hợp lệ.";
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return "Mật khẩu mới phải có tối thiểu 6 ký tự.";
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return "Mật khẩu xác nhận không khớp với mật khẩu mới.";
        }

        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (userOpt.isEmpty()) {
            return "Người dùng không tồn tại.";
        }

        User user = userOpt.get();
        boolean currentMatches = passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())
                || request.getCurrentPassword().equals(user.getPasswordHash());

        if (!currentMatches) {
            return "Mật khẩu hiện tại không đúng.";
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        AuditLog log = new AuditLog(user.getId(), "CHANGE_PASSWORD", "users", String.valueOf(user.getId()), "{\"action\":\"PASSWORD_CHANGED\"}", ipAddress);
        auditLogRepository.save(log);

        return "SUCCESS";
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request, String ipAddress) {
        String identifier = request.getEmailOrPhone() != null ? request.getEmailOrPhone().trim() : "";
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(identifier);
        }

        if (userOpt.isEmpty()) {
            return "Không tìm thấy tài khoản với thông tin đã cung cấp.";
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PasswordResetToken resetToken = new PasswordResetToken(user.getId(), token, LocalDateTime.now().plusHours(2));
        passwordResetTokenRepository.save(resetToken);

        AuditLog log = new AuditLog(user.getId(), "FORGOT_PASSWORD", "password_reset_tokens", token, "{\"identifier\":\"" + identifier + "\"}", ipAddress);
        auditLogRepository.save(log);

        return token;
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request, String ipAddress) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            return "Mã xác thực không được để trống.";
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return "Mật khẩu mới phải có ít nhất 6 ký tự.";
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return "Mật khẩu xác nhận không khớp.";
        }

        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository
                .findByTokenAndIsUsedFalseAndExpiresAtAfter(request.getToken().trim().toUpperCase(), LocalDateTime.now());

        if (tokenOpt.isEmpty()) {
            return "Mã xác thực không hợp lệ hoặc đã hết hạn.";
        }

        PasswordResetToken resetToken = tokenOpt.get();
        Optional<User> userOpt = userRepository.findById(resetToken.getUserId());
        if (userOpt.isEmpty()) {
            return "Tài khoản không tồn tại.";
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setIsUsed(true);
        passwordResetTokenRepository.save(resetToken);

        AuditLog log = new AuditLog(user.getId(), "RESET_PASSWORD", "users", String.valueOf(user.getId()), "{\"status\":\"PASSWORD_RESET_SUCCESS\"}", ipAddress);
        auditLogRepository.save(log);

        return "SUCCESS";
    }

    public UserSummary toUserSummary(User user) {
        UserSummary summary = new UserSummary();
        summary.setId(user.getId());
        summary.setUsername(user.getUsername());
        summary.setEmail(user.getEmail());
        summary.setPhone(user.getPhone());
        summary.setAvatarUrl(user.getAvatarUrl());
        summary.setIsActive(user.getIsActive());
        summary.setLastLoginAt(user.getLastLoginAt());

        Set<String> roleCodes = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        summary.setRoles(roleCodes);

        Set<String> permissionCodes = new HashSet<>();
        for (Role role : user.getRoles()) {
            if (role.getPermissions() != null) {
                role.getPermissions().forEach(p -> permissionCodes.add(p.getCode()));
            }
        }
        summary.setPermissions(permissionCodes);
        return summary;
    }
}
