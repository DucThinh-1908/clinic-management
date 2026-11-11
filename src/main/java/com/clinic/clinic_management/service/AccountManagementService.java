package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AccountDtos.CreateAccountRequest;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AccountManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private RolePermissionService rolePermissionService;

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
        try {
            syncUsersFromKeycloak();
        } catch (Exception ignored) {}
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

        User user = new User();
        user.setUsername(request.getUsername().trim());
        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty())
                ? request.getPassword().trim()
                : "CarePlus@123";
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setIsActive(true);
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Assign roles
        if (request.getRoleCodes() != null && !request.getRoleCodes().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String code : request.getRoleCodes()) {
                roleRepository.findByCode(code.toLowerCase()).ifPresent(roles::add);
            }
            user.setRoles(roles);
        } else {
            roleRepository.findByCode("patient").ifPresent(r -> user.setRoles(Set.of(r)));
        }

        User saved = userRepository.save(user);

        // Audit log
        AuditLog log = new AuditLog(adminId, "CREATE_USER", "users", String.valueOf(saved.getId()),
                "{\"username\":\"" + saved.getUsername() + "\",\"roles\":\"" + request.getRoleCodes() + "\"}", ipAddress);
        auditLogRepository.save(log);

        return authService.toUserSummary(saved);
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
            if (user.getId().equals(adminId)) {
                throw new IllegalArgumentException("Bạn không thể tự khóa tài khoản quản trị của chính mình.");
            }
            boolean isTargetSuperAdmin = user.getRoles() != null && user.getRoles().stream()
                    .anyMatch(r -> "admin".equalsIgnoreCase(r.getCode()));
            if (isTargetSuperAdmin) {
                long activeAdminCount = userRepository.findAll().stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                        .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> "admin".equalsIgnoreCase(r.getCode())))
                        .count();
                if (activeAdminCount <= 1) {
                    throw new IllegalArgumentException("Không thể khóa tài khoản Quản trị viên (Admin) duy nhất còn hoạt động trong hệ thống.");
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

    @Transactional
    public Map<String, Object> syncUsersFromKeycloak() {
        int syncedCount = 0;
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

            // 1. Lấy token admin từ Keycloak
            String form = "grant_type=password&client_id=admin-cli&username=admin&password=admin_password";
            java.net.http.HttpRequest tokenReq = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:8081/realms/master/protocol/openid-connect/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(form))
                    .build();
            java.net.http.HttpResponse<String> tokenRes = client.send(tokenReq, java.net.http.HttpResponse.BodyHandlers.ofString());
            Matcher tokenMatcher = Pattern.compile("\"access_token\"\\s*:\\s*\"([^\"]+)\"").matcher(tokenRes.body());
            if (!tokenMatcher.find()) {
                return Map.of("success", false, "message", "Không thể lấy access_token từ Keycloak.");
            }
            String token = tokenMatcher.group(1);

            // 2. Đồng bộ quyền hạn (Composite Roles) của từng Realm Role từ Keycloak về MySQL
            try {
                java.net.http.HttpRequest clientReq = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("http://localhost:8081/admin/realms/clinic-realm/clients?clientId=clinic-frontend"))
                        .header("Authorization", "Bearer " + token)
                        .GET()
                        .build();
                java.net.http.HttpResponse<String> clientRes = client.send(clientReq, java.net.http.HttpResponse.BodyHandlers.ofString());
                Matcher clientIdM = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(clientRes.body());
                if (clientIdM.find()) {
                    String clientUuid = clientIdM.group(1);
                    List<Role> allDbRoles = roleRepository.findAll();
                    for (Role dbRole : allDbRoles) {
                        java.net.http.HttpRequest compReq = java.net.http.HttpRequest.newBuilder()
                                .uri(java.net.URI.create("http://localhost:8081/admin/realms/clinic-realm/roles/" + dbRole.getCode() + "/composites/clients/" + clientUuid))
                                .header("Authorization", "Bearer " + token)
                                .GET()
                                .build();
                        java.net.http.HttpResponse<String> compRes = client.send(compReq, java.net.http.HttpResponse.BodyHandlers.ofString());
                        if (compRes.statusCode() == 200) {
                            Set<Permission> exactPerms = new HashSet<>();
                            Matcher permNameM = Pattern.compile("\"name\"\\s*:\\s*\"([^\"]+)\"").matcher(compRes.body());
                            while (permNameM.find()) {
                                String pCode = permNameM.group(1).trim().toUpperCase();
                                permissionRepository.findByCode(pCode).ifPresent(exactPerms::add);
                            }
                            dbRole.setPermissions(exactPerms);
                            roleRepository.save(dbRole);
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 3. Lấy danh sách toàn bộ users từ clinic-realm
            java.net.http.HttpRequest usersReq = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:8081/admin/realms/clinic-realm/users"))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
            java.net.http.HttpResponse<String> usersRes = client.send(usersReq, java.net.http.HttpResponse.BodyHandlers.ofString());
            String usersBody = usersRes.body();

            // Phân tách các phần tử theo dấu phẩy giữa các object
            String cleaned = usersBody.trim();
            if (cleaned.startsWith("[")) cleaned = cleaned.substring(1);
            if (cleaned.endsWith("]")) cleaned = cleaned.substring(0, cleaned.length() - 1);
            String[] userChunks = cleaned.split("(?<=\\})\\s*,\\s*(?=\\{)");

            for (String chunk : userChunks) {
                Matcher idM = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(chunk);
                Matcher userM = Pattern.compile("\"username\"\\s*:\\s*\"([^\"]+)\"").matcher(chunk);
                Matcher emailM = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"").matcher(chunk);

                if (!userM.find()) continue;
                String username = userM.group(1).trim();
                String email = emailM.find() ? emailM.group(1).trim() : null;
                String userId = idM.find() ? idM.group(1).trim() : null;

                Set<String> roleCodes = new HashSet<>();
                if (userId != null) {
                    try {
                        java.net.http.HttpRequest rolesReq = java.net.http.HttpRequest.newBuilder()
                                .uri(java.net.URI.create("http://localhost:8081/admin/realms/clinic-realm/users/" + userId + "/role-mappings/realm"))
                                .header("Authorization", "Bearer " + token)
                                .GET()
                                .build();
                        java.net.http.HttpResponse<String> rolesRes = client.send(rolesReq, java.net.http.HttpResponse.BodyHandlers.ofString());
                        Matcher roleNameM = Pattern.compile("\"name\"\\s*:\\s*\"([^\"]+)\"").matcher(rolesRes.body());
                        while (roleNameM.find()) {
                            String rName = roleNameM.group(1);
                            if (!"default-roles-clinic-realm".equals(rName) && !"offline_access".equals(rName) && !"uma_authorization".equals(rName)) {
                                roleCodes.add(rName);
                            }
                        }
                    } catch (Exception ignored) {}
                }

                authService.syncKeycloakUser(username, email, username, roleCodes, null, "127.0.0.1");
                syncedCount++;
            }
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ Keycloak: " + e.getMessage());
        }
        return Map.of("success", true, "message", "Đã đồng bộ thành công " + syncedCount + " tài khoản và phân quyền từ Keycloak.", "syncedCount", syncedCount);
    }
}
