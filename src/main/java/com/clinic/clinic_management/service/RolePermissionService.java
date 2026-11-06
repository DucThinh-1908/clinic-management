package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AccountDtos.AssignRolesRequest;
import com.clinic.clinic_management.dto.AuthDtos.UserSummary;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

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
        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleCodes(roleCodes);
        return assignRolesToUser(userId, req, adminId, ipAddress);
    }

    @Transactional
    public UserSummary assignRolesToUser(Long userId, AssignRolesRequest request, Long adminId, String ipAddress) {
        authService.validateAdminOrManager(adminId);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId);
        }

        User user = userOpt.get();
        Set<String> roleCodes = request != null ? request.getRoleCodes() : new HashSet<>();
        Set<Role> roles = new HashSet<>();
        if (roleCodes != null) {
            for (String code : roleCodes) {
                roleRepository.findByCode(code).ifPresent(roles::add);
            }
        }
        user.setRoles(roles);
        user.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(user);

        // Xử lý riêng khi gán vai trò Bác sĩ (Doctor): Gán cả phòng ban và chuyên môn
        if (roleCodes != null && roleCodes.contains("doctor")) {
            Long deptId = request != null ? request.getDepartmentId() : null;
            Optional<Staff> existingStaff = staffRepository.findByUserId(userId);

            if (deptId == null && (existingStaff.isEmpty() || existingStaff.get().getDepartmentId() == null)) {
                throw new IllegalArgumentException("Khi gán vai trò Bác sĩ, bắt buộc phải chọn phòng ban (khoa công tác) và chuyên môn điều trị cho bác sĩ.");
            }

            Department department = null;
            if (deptId != null) {
                department = departmentRepository.findById(deptId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoa/phòng ban với ID: " + deptId));
            } else if (existingStaff.isPresent() && existingStaff.get().getDepartmentId() != null) {
                department = departmentRepository.findById(existingStaff.get().getDepartmentId()).orElse(null);
            }

            // Tạo mới hoặc cập nhật hồ sơ Staff
            Staff staff = existingStaff.orElseGet(() -> {
                Staff newStaff = new Staff();
                newStaff.setUserId(userId);
                newStaff.setStaffCode("BS" + String.format("%04d", (System.currentTimeMillis() + userId) % 10000));
                newStaff.setGender("OTHER");
                newStaff.setHireDate(LocalDate.now());
                return newStaff;
            });

            if (department != null) {
                staff.setDepartmentId(department.getId());
            }

            String fullName = request != null ? request.getFullName() : null;
            if (fullName != null && !fullName.trim().isEmpty()) {
                staff.setFullName(fullName.trim());
            } else if (staff.getFullName() == null || staff.getFullName().trim().isEmpty()) {
                staff.setFullName(user.getUsername());
            }

            String qualification = request != null ? request.getQualification() : null;
            if (qualification != null && !qualification.trim().isEmpty()) {
                staff.setQualification(qualification.trim());
            } else if (staff.getQualification() == null) {
                staff.setQualification("Bác sĩ chuyên khoa");
            }
            staff.setStatus("ACTIVE");
            Staff savedStaff = staffRepository.save(staff);

            // Cập nhật hoặc tạo DoctorProfile (Chuyên môn)
            DoctorProfile doc = doctorProfileRepository.findByStaffId(savedStaff.getId()).orElseGet(() -> {
                DoctorProfile newDoc = new DoctorProfile();
                newDoc.setStaffId(savedStaff.getId());
                return newDoc;
            });

            String specialty = request != null ? request.getSpecialty() : null;
            if (specialty != null && !specialty.trim().isEmpty()) {
                doc.setSpecialty(specialty.trim());
            } else if (doc.getSpecialty() == null || doc.getSpecialty().trim().isEmpty()) {
                doc.setSpecialty(department != null ? department.getName() : "Đa khoa tổng quát");
            }

            if (request != null && request.getLicenseNumber() != null && !request.getLicenseNumber().trim().isEmpty()) {
                doc.setLicenseNumber(request.getLicenseNumber().trim());
            }
            if (request != null && request.getConsultationFee() != null) {
                doc.setConsultationFee(request.getConsultationFee());
            } else if (doc.getConsultationFee() == null) {
                doc.setConsultationFee(new BigDecimal("200000.00"));
            }
            doctorProfileRepository.save(doc);
        } else if (roleCodes != null && request != null && request.getDepartmentId() != null) {
            // Nếu là các vai trò nhân viên y tế khác và có chọn phòng ban
            Long deptId = request.getDepartmentId();
            departmentRepository.findById(deptId).ifPresent(dept -> {
                Staff staff = staffRepository.findByUserId(userId).orElseGet(() -> {
                    Staff newStaff = new Staff();
                    newStaff.setUserId(userId);
                    newStaff.setStaffCode("NV" + String.format("%04d", (System.currentTimeMillis() + userId) % 10000));
                    newStaff.setGender("OTHER");
                    newStaff.setHireDate(LocalDate.now());
                    newStaff.setFullName(request.getFullName() != null && !request.getFullName().trim().isEmpty() ? request.getFullName().trim() : user.getUsername());
                    return newStaff;
                });
                staff.setDepartmentId(dept.getId());
                staff.setStatus("ACTIVE");
                staffRepository.save(staff);
            });
        }

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
