package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.StaffSchedulingDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StaffSchedulingService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ClinicRoomRepository clinicRoomRepository;

    @Autowired
    private WorkShiftRepository workShiftRepository;

    @Autowired
    private StaffScheduleRepository staffScheduleRepository;

    @Autowired
    private LeaveSwapRequestRepository leaveSwapRequestRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuthService authService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // =========================================================================
    // UC-NS01: Thêm hồ sơ nhân viên (Tác nhân: Quản lý)
    // =========================================================================
    @Transactional
    public StaffResponse createStaff(StaffCreateRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        if (req.fullName == null || req.fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Họ tên nhân viên không được để trống.");
        }
        if (req.gender == null || req.gender.trim().isEmpty()) {
            throw new IllegalArgumentException("Giới tính không được để trống.");
        }

        Long targetUserId = req.userId;

        // Nếu chưa có userId nhưng có username & password thì tự tạo user mới
        if (targetUserId == null) {
            if (req.username == null || req.username.trim().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng cung cấp tài khoản người dùng hoặc tên đăng nhập mới cho nhân viên.");
            }
            if (userRepository.existsByUsername(req.username.trim())) {
                throw new IllegalArgumentException("Tên đăng nhập '" + req.username + "' đã tồn tại trong hệ thống.");
            }

            User newUser = new User();
            newUser.setUsername(req.username.trim());
            String rawPassword = (req.password != null && !req.password.trim().isEmpty()) ? req.password.trim() : "123456";
            newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
            newUser.setEmail(req.email != null ? req.email.trim() : null);
            newUser.setPhone(req.phone != null ? req.phone.trim() : null);
            newUser.setIsActive(true);
            newUser.setIsVerified(true);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());

            String roleCode = req.roleCode != null ? req.roleCode.trim().toLowerCase() : "nurse";
            roleRepository.findByCode(roleCode).ifPresent(r -> newUser.getRoles().add(r));

            User savedUser = userRepository.save(newUser);
            targetUserId = savedUser.getId();
        } else {
            // Kiểm tra user có tồn tại và đã liên kết với staff khác chưa
            if (!userRepository.existsById(targetUserId)) {
                throw new IllegalArgumentException("Tài khoản người dùng liên kết không tồn tại.");
            }
            if (staffRepository.existsByUserId(targetUserId)) {
                throw new IllegalArgumentException("Tài khoản này đã được gán hồ sơ nhân viên y tế.");
            }
        }

        // Tạo mã nhân viên tự động nếu chưa có
        String staffCode = req.staffCode != null ? req.staffCode.trim() : "";
        if (staffCode.isEmpty()) {
            String prefix = "NV";
            if ("doctor".equalsIgnoreCase(req.roleCode)) prefix = "BS";
            else if ("nurse".equalsIgnoreCase(req.roleCode)) prefix = "DD";
            else if ("receptionist".equalsIgnoreCase(req.roleCode)) prefix = "LT";
            else if ("technician".equalsIgnoreCase(req.roleCode)) prefix = "KTV";
            else if ("pharmacist".equalsIgnoreCase(req.roleCode)) prefix = "DS";
            else if ("cashier".equalsIgnoreCase(req.roleCode)) prefix = "TN";
            staffCode = prefix + String.format("%04d", System.currentTimeMillis() % 10000);
        }

        if (staffRepository.existsByStaffCode(staffCode)) {
            staffCode = staffCode + "_" + (System.currentTimeMillis() % 1000);
        }

        if (req.idCardNumber != null && !req.idCardNumber.trim().isEmpty()) {
            if (staffRepository.existsByIdCardNumber(req.idCardNumber.trim())) {
                throw new IllegalArgumentException("Số CMND/CCCD '" + req.idCardNumber + "' đã tồn tại trên hồ sơ nhân sự khác.");
            }
        }

        Staff staff = new Staff();
        staff.setUserId(targetUserId);
        staff.setDepartmentId(req.departmentId);
        staff.setStaffCode(staffCode);
        staff.setFullName(req.fullName.trim());
        staff.setGender(req.gender.toUpperCase());
        staff.setDateOfBirth(req.dateOfBirth);
        staff.setIdCardNumber(req.idCardNumber != null ? req.idCardNumber.trim() : null);
        staff.setAddress(req.address != null ? req.address.trim() : null);
        staff.setQualification(req.qualification != null ? req.qualification.trim() : null);
        staff.setHireDate(req.hireDate != null ? req.hireDate : LocalDate.now());
        staff.setStatus(req.status != null ? req.status.toUpperCase() : "ACTIVE");

        Staff savedStaff = staffRepository.save(staff);

        // Nếu có thông tin bác sĩ hoặc vai trò là doctor
        if (req.specialty != null || req.licenseNumber != null || "doctor".equalsIgnoreCase(req.roleCode)) {
            DoctorProfile doc = new DoctorProfile();
            doc.setStaffId(savedStaff.getId());
            doc.setLicenseNumber(req.licenseNumber != null ? req.licenseNumber.trim() : null);
            doc.setSpecialty(req.specialty != null ? req.specialty.trim() : "Đa khoa tổng quát");
            if (req.consultationFee != null) doc.setConsultationFee(req.consultationFee);
            doc.setBiography(req.biography);
            doc.setYearsOfExperience(req.yearsOfExperience != null ? req.yearsOfExperience : 0);
            doctorProfileRepository.save(doc);
        }

        auditLogRepository.save(new AuditLog(actorUserId, "CREATE_STAFF", "staff", String.valueOf(savedStaff.getId()),
                "{\"staffCode\":\"" + savedStaff.getStaffCode() + "\",\"fullName\":\"" + savedStaff.getFullName() + "\"}", ipAddress));

        return toStaffResponse(savedStaff);
    }

    // =========================================================================
    // UC-NS02: Cập nhật / cho nghỉ việc nhân viên (Tác nhân: Quản lý)
    // =========================================================================
    @Transactional
    public StaffResponse updateStaff(Long staffId, StaffUpdateRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân viên với mã ID: " + staffId));

        if (req.fullName != null && !req.fullName.trim().isEmpty()) {
            staff.setFullName(req.fullName.trim());
        }
        if (req.gender != null) {
            staff.setGender(req.gender.toUpperCase());
        }
        if (req.dateOfBirth != null) {
            staff.setDateOfBirth(req.dateOfBirth);
        }
        if (req.idCardNumber != null && !req.idCardNumber.trim().isEmpty()) {
            if (!req.idCardNumber.trim().equals(staff.getIdCardNumber()) && staffRepository.existsByIdCardNumber(req.idCardNumber.trim())) {
                throw new IllegalArgumentException("Số CMND/CCCD '" + req.idCardNumber + "' đã được sử dụng bởi nhân sự khác.");
            }
            staff.setIdCardNumber(req.idCardNumber.trim());
        }
        if (req.address != null) {
            staff.setAddress(req.address.trim());
        }
        if (req.qualification != null) {
            staff.setQualification(req.qualification.trim());
        }
        if (req.hireDate != null) {
            staff.setHireDate(req.hireDate);
        }
        if (req.departmentId != null) {
            staff.setDepartmentId(req.departmentId);
        }
        if (req.status != null) {
            staff.setStatus(req.status.toUpperCase());
        }

        Staff savedStaff = staffRepository.save(staff);

        // Cập nhật thông tin tài khoản liên kết (email/phone)
        if (staff.getUserId() != null) {
            userRepository.findById(staff.getUserId()).ifPresent(u -> {
                if (req.phone != null) u.setPhone(req.phone.trim());
                if (req.email != null) u.setEmail(req.email.trim());
                userRepository.save(u);
            });
        }

        // Cập nhật thông tin bác sĩ nếu có
        if (req.specialty != null || req.licenseNumber != null || req.consultationFee != null || req.biography != null || req.yearsOfExperience != null) {
            DoctorProfile doc = doctorProfileRepository.findByStaffId(staffId).orElseGet(() -> {
                DoctorProfile newDoc = new DoctorProfile();
                newDoc.setStaffId(staffId);
                return newDoc;
            });
            if (req.specialty != null) doc.setSpecialty(req.specialty.trim());
            if (req.licenseNumber != null) doc.setLicenseNumber(req.licenseNumber.trim());
            if (req.consultationFee != null) doc.setConsultationFee(req.consultationFee);
            if (req.biography != null) doc.setBiography(req.biography);
            if (req.yearsOfExperience != null) doc.setYearsOfExperience(req.yearsOfExperience);
            doctorProfileRepository.save(doc);
        }

        auditLogRepository.save(new AuditLog(actorUserId, "UPDATE_STAFF", "staff", String.valueOf(savedStaff.getId()),
                "{\"staffCode\":\"" + savedStaff.getStaffCode() + "\",\"status\":\"" + savedStaff.getStatus() + "\"}", ipAddress));

        return toStaffResponse(savedStaff);
    }

    @Transactional
    public StaffResponse changeStaffStatus(Long staffId, StaffStatusRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân viên với mã ID: " + staffId));

        String newStatus = req.status != null ? req.status.trim().toUpperCase() : "RESIGNED";
        staff.setStatus(newStatus);
        Staff saved = staffRepository.save(staff);

        // Nếu cho nghỉ việc, có thể khóa tài khoản người dùng
        if ("RESIGNED".equalsIgnoreCase(newStatus) && staff.getUserId() != null) {
            userRepository.findById(staff.getUserId()).ifPresent(u -> {
                u.setIsActive(false);
                userRepository.save(u);
            });
        } else if ("ACTIVE".equalsIgnoreCase(newStatus) && staff.getUserId() != null) {
            userRepository.findById(staff.getUserId()).ifPresent(u -> {
                u.setIsActive(true);
                userRepository.save(u);
            });
        }

        auditLogRepository.save(new AuditLog(actorUserId, "CHANGE_STAFF_STATUS", "staff", String.valueOf(saved.getId()),
                "{\"newStatus\":\"" + newStatus + "\",\"reason\":\"" + (req.reason != null ? req.reason : "") + "\"}", ipAddress));

        return toStaffResponse(saved);
    }

    public List<StaffResponse> getAllStaff(String search, String status, Long departmentId) {
        List<Staff> list = staffRepository.findAll();
        return list.stream()
                .filter(s -> {
                    if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                        if (!status.equalsIgnoreCase(s.getStatus())) return false;
                    }
                    if (departmentId != null && departmentId > 0) {
                        if (s.getDepartmentId() == null || !s.getDepartmentId().equals(departmentId)) return false;
                    }
                    if (search != null && !search.trim().isEmpty()) {
                        String kw = search.trim().toLowerCase();
                        boolean matchName = s.getFullName() != null && s.getFullName().toLowerCase().contains(kw);
                        boolean matchCode = s.getStaffCode() != null && s.getStaffCode().toLowerCase().contains(kw);
                        boolean matchIdCard = s.getIdCardNumber() != null && s.getIdCardNumber().toLowerCase().contains(kw);
                        return matchName || matchCode || matchIdCard;
                    }
                    return true;
                })
                .map(this::toStaffResponse)
                .collect(Collectors.toList());
    }

    public StaffResponse getStaffById(Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + staffId));
        return toStaffResponse(staff);
    }

    public Optional<Staff> getStaffByUserId(Long userId) {
        return staffRepository.findByUserId(userId);
    }

    private StaffResponse toStaffResponse(Staff s) {
        StaffResponse res = new StaffResponse();
        res.id = s.getId();
        res.userId = s.getUserId();
        res.staffCode = s.getStaffCode();
        res.fullName = s.getFullName();
        res.gender = s.getGender();
        res.dateOfBirth = s.getDateOfBirth();
        res.idCardNumber = s.getIdCardNumber();
        res.address = s.getAddress();
        res.qualification = s.getQualification();
        res.hireDate = s.getHireDate();
        res.status = s.getStatus();
        res.departmentId = s.getDepartmentId();
        res.createdAt = s.getCreatedAt();

        if (s.getDepartmentId() != null) {
            departmentRepository.findById(s.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
        }

        if (s.getUserId() != null) {
            userRepository.findById(s.getUserId()).ifPresent(u -> {
                res.username = u.getUsername();
                res.email = u.getEmail();
                res.phone = u.getPhone();
                if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                    Role firstRole = u.getRoles().iterator().next();
                    res.roleCode = firstRole.getCode();
                    res.roleName = firstRole.getName();
                }
            });
        }

        doctorProfileRepository.findByStaffId(s.getId()).ifPresent(d -> {
            res.licenseNumber = d.getLicenseNumber();
            res.specialty = d.getSpecialty();
            res.consultationFee = d.getConsultationFee();
            res.biography = d.getBiography();
            res.yearsOfExperience = d.getYearsOfExperience();
        });

        return res;
    }

    // =========================================================================
    // UC-NS03: Quản lý chuyên khoa và phòng khám (Tác nhân: Quản lý)
    // =========================================================================
    public List<DepartmentResponse> getAllDepartments() {
        List<Department> departments = departmentRepository.findAllByOrderByCreatedAtDesc();
        List<ClinicRoom> rooms = clinicRoomRepository.findAll();
        List<Staff> staffList = staffRepository.findAll();

        return departments.stream().map(d -> {
            DepartmentResponse res = new DepartmentResponse();
            res.id = d.getId();
            res.code = d.getCode();
            res.name = d.getName();
            res.description = d.getDescription();
            res.location = d.getLocation();
            res.isActive = d.getIsActive();
            res.createdAt = d.getCreatedAt();
            res.roomCount = (int) rooms.stream().filter(r -> d.getId().equals(r.getDepartmentId())).count();
            res.staffCount = (int) staffList.stream().filter(s -> d.getId().equals(s.getDepartmentId())).count();
            return res;
        }).collect(Collectors.toList());
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        if (req.name == null || req.name.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên chuyên khoa/phòng ban không được để trống.");
        }
        if (req.code == null || req.code.trim().isEmpty()) {
            throw new IllegalArgumentException("Mã chuyên khoa không được để trống.");
        }
        if (departmentRepository.existsByCode(req.code.trim().toUpperCase())) {
            throw new IllegalArgumentException("Mã chuyên khoa '" + req.code + "' đã tồn tại.");
        }

        Department d = new Department();
        d.setCode(req.code.trim().toUpperCase());
        d.setName(req.name.trim());
        d.setDescription(req.description);
        d.setLocation(req.location);
        d.setIsActive(req.isActive != null ? req.isActive : true);

        Department saved = departmentRepository.save(d);

        auditLogRepository.save(new AuditLog(actorUserId, "CREATE_DEPARTMENT", "departments", String.valueOf(saved.getId()),
                "{\"code\":\"" + saved.getCode() + "\",\"name\":\"" + saved.getName() + "\"}", ipAddress));

        DepartmentResponse res = new DepartmentResponse();
        res.id = saved.getId();
        res.code = saved.getCode();
        res.name = saved.getName();
        res.description = saved.getDescription();
        res.location = saved.getLocation();
        res.isActive = saved.getIsActive();
        res.createdAt = saved.getCreatedAt();
        return res;
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyên khoa với ID: " + id));

        if (req.name != null && !req.name.trim().isEmpty()) d.setName(req.name.trim());
        if (req.description != null) d.setDescription(req.description);
        if (req.location != null) d.setLocation(req.location);
        if (req.isActive != null) d.setIsActive(req.isActive);

        Department saved = departmentRepository.save(d);

        auditLogRepository.save(new AuditLog(actorUserId, "UPDATE_DEPARTMENT", "departments", String.valueOf(saved.getId()),
                "{\"name\":\"" + saved.getName() + "\"}", ipAddress));

        DepartmentResponse res = new DepartmentResponse();
        res.id = saved.getId();
        res.code = saved.getCode();
        res.name = saved.getName();
        res.description = saved.getDescription();
        res.location = saved.getLocation();
        res.isActive = saved.getIsActive();
        res.createdAt = saved.getCreatedAt();
        return res;
    }

    @Transactional
    public DepartmentResponse toggleDepartmentStatus(Long id, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyên khoa với ID: " + id));

        d.setIsActive(!Boolean.TRUE.equals(d.getIsActive()));
        Department saved = departmentRepository.save(d);

        auditLogRepository.save(new AuditLog(actorUserId, "TOGGLE_DEPARTMENT_STATUS", "departments", String.valueOf(saved.getId()),
                "{\"isActive\":" + saved.getIsActive() + "}", ipAddress));

        DepartmentResponse res = new DepartmentResponse();
        res.id = saved.getId();
        res.code = saved.getCode();
        res.name = saved.getName();
        res.description = saved.getDescription();
        res.location = saved.getLocation();
        res.isActive = saved.getIsActive();
        res.createdAt = saved.getCreatedAt();
        return res;
    }

    // Quản lý phòng khám (Clinic Rooms)
    public List<ClinicRoomResponse> getAllRooms(Long departmentId) {
        List<ClinicRoom> rooms = (departmentId != null && departmentId > 0)
                ? clinicRoomRepository.findByDepartmentId(departmentId)
                : clinicRoomRepository.findAll();

        Map<Long, String> deptNames = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

        return rooms.stream().map(r -> {
            ClinicRoomResponse res = new ClinicRoomResponse();
            res.id = r.getId();
            res.departmentId = r.getDepartmentId();
            res.departmentName = deptNames.getOrDefault(r.getDepartmentId(), "Chưa phân khoa");
            res.roomNumber = r.getRoomNumber();
            res.name = r.getName();
            res.roomType = r.getRoomType();
            res.isAvailable = r.getIsAvailable();
            return res;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ClinicRoomResponse createRoom(ClinicRoomRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        if (req.roomNumber == null || req.roomNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Số phòng không được để trống.");
        }
        if (req.name == null || req.name.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên phòng khám không được để trống.");
        }
        if (req.departmentId == null || !departmentRepository.existsById(req.departmentId)) {
            throw new IllegalArgumentException("Vui lòng chọn chuyên khoa / phòng ban hợp lệ.");
        }
        if (clinicRoomRepository.existsByRoomNumber(req.roomNumber.trim())) {
            throw new IllegalArgumentException("Số phòng '" + req.roomNumber + "' đã tồn tại.");
        }

        ClinicRoom room = new ClinicRoom();
        room.setDepartmentId(req.departmentId);
        room.setRoomNumber(req.roomNumber.trim());
        room.setName(req.name.trim());
        room.setRoomType(req.roomType != null ? req.roomType.toUpperCase() : "EXAMINATION");
        room.setIsAvailable(req.isAvailable != null ? req.isAvailable : true);

        ClinicRoom saved = clinicRoomRepository.save(room);

        auditLogRepository.save(new AuditLog(actorUserId, "CREATE_ROOM", "clinic_rooms", String.valueOf(saved.getId()),
                "{\"roomNumber\":\"" + saved.getRoomNumber() + "\",\"name\":\"" + saved.getName() + "\"}", ipAddress));

        ClinicRoomResponse res = new ClinicRoomResponse();
        res.id = saved.getId();
        res.departmentId = saved.getDepartmentId();
        departmentRepository.findById(saved.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
        res.roomNumber = saved.getRoomNumber();
        res.name = saved.getName();
        res.roomType = saved.getRoomType();
        res.isAvailable = saved.getIsAvailable();
        return res;
    }

    @Transactional
    public ClinicRoomResponse updateRoom(Long id, ClinicRoomRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        ClinicRoom room = clinicRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng khám với ID: " + id));

        if (req.roomNumber != null && !req.roomNumber.trim().isEmpty()) {
            if (!req.roomNumber.trim().equalsIgnoreCase(room.getRoomNumber()) && clinicRoomRepository.existsByRoomNumber(req.roomNumber.trim())) {
                throw new IllegalArgumentException("Số phòng '" + req.roomNumber + "' đã tồn tại.");
            }
            room.setRoomNumber(req.roomNumber.trim());
        }
        if (req.name != null && !req.name.trim().isEmpty()) room.setName(req.name.trim());
        if (req.departmentId != null) room.setDepartmentId(req.departmentId);
        if (req.roomType != null) room.setRoomType(req.roomType.toUpperCase());
        if (req.isAvailable != null) room.setIsAvailable(req.isAvailable);

        ClinicRoom saved = clinicRoomRepository.save(room);

        auditLogRepository.save(new AuditLog(actorUserId, "UPDATE_ROOM", "clinic_rooms", String.valueOf(saved.getId()),
                "{\"roomNumber\":\"" + saved.getRoomNumber() + "\"}", ipAddress));

        ClinicRoomResponse res = new ClinicRoomResponse();
        res.id = saved.getId();
        res.departmentId = saved.getDepartmentId();
        departmentRepository.findById(saved.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
        res.roomNumber = saved.getRoomNumber();
        res.name = saved.getName();
        res.roomType = saved.getRoomType();
        res.isAvailable = saved.getIsAvailable();
        return res;
    }

    @Transactional
    public ClinicRoomResponse toggleRoomAvailability(Long id, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        ClinicRoom room = clinicRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng khám với ID: " + id));

        room.setIsAvailable(!Boolean.TRUE.equals(room.getIsAvailable()));
        ClinicRoom saved = clinicRoomRepository.save(room);

        auditLogRepository.save(new AuditLog(actorUserId, "TOGGLE_ROOM_AVAILABILITY", "clinic_rooms", String.valueOf(saved.getId()),
                "{\"isAvailable\":" + saved.getIsAvailable() + "}", ipAddress));

        ClinicRoomResponse res = new ClinicRoomResponse();
        res.id = saved.getId();
        res.departmentId = saved.getDepartmentId();
        departmentRepository.findById(saved.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
        res.roomNumber = saved.getRoomNumber();
        res.name = saved.getName();
        res.roomType = saved.getRoomType();
        res.isAvailable = saved.getIsAvailable();
        return res;
    }

    // =========================================================================
    // UC-NS04 & UC-NS05: Phân lịch & Xem lịch làm việc
    // =========================================================================
    public List<WorkShiftResponse> getAllShifts() {
        return workShiftRepository.findAllByOrderByStartTimeAsc().stream().map(s -> {
            WorkShiftResponse res = new WorkShiftResponse();
            res.id = s.getId();
            res.name = s.getName();
            res.startTime = s.getStartTime();
            res.endTime = s.getEndTime();
            return res;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ScheduleResponse createSchedule(ScheduleCreateRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        if (req.staffId == null || !staffRepository.existsById(req.staffId)) {
            throw new IllegalArgumentException("Vui lòng chọn nhân viên/bác sĩ hợp lệ.");
        }
        if (req.shiftId == null || !workShiftRepository.existsById(req.shiftId)) {
            throw new IllegalArgumentException("Vui lòng chọn ca làm việc hợp lệ.");
        }
        if (req.workDate == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày làm việc.");
        }

        // Kiểm tra nhân sự đã có lịch trong ca và ngày này chưa
        if (staffScheduleRepository.existsByStaffIdAndShiftIdAndWorkDate(req.staffId, req.shiftId, req.workDate)) {
            Staff s = staffRepository.findById(req.staffId).orElse(null);
            String name = s != null ? s.getFullName() : "Nhân viên";
            throw new IllegalArgumentException("Nhân viên " + name + " đã được phân lịch trong ca này vào ngày " + req.workDate);
        }

        // Kiểm tra phòng khám đã có người trực ca này chưa (nếu có chọn phòng)
        if (req.roomId != null && req.roomId > 0) {
            if (staffScheduleRepository.existsByRoomIdAndShiftIdAndWorkDate(req.roomId, req.shiftId, req.workDate)) {
                ClinicRoom r = clinicRoomRepository.findById(req.roomId).orElse(null);
                String roomName = r != null ? r.getName() : "Phòng";
                throw new IllegalArgumentException(roomName + " đã có bác sĩ/nhân sự được phân công trực trong ca này.");
            }
        }

        StaffSchedule schedule = new StaffSchedule();
        schedule.setStaffId(req.staffId);
        schedule.setShiftId(req.shiftId);
        schedule.setRoomId(req.roomId);
        schedule.setWorkDate(req.workDate);
        schedule.setNote(req.note);
        schedule.setStatus("SCHEDULED");

        StaffSchedule saved = staffScheduleRepository.save(schedule);

        auditLogRepository.save(new AuditLog(actorUserId, "CREATE_SCHEDULE", "staff_schedules", String.valueOf(saved.getId()),
                "{\"staffId\":" + saved.getStaffId() + ",\"date\":\"" + saved.getWorkDate() + "\"}", ipAddress));

        return toScheduleResponse(saved);
    }

    @Transactional
    public List<ScheduleResponse> batchCreateSchedules(ScheduleBatchCreateRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        if (req.schedules == null || req.schedules.isEmpty()) {
            throw new IllegalArgumentException("Danh sách lịch làm việc không được rỗng.");
        }

        List<ScheduleResponse> results = new ArrayList<>();
        for (ScheduleCreateRequest item : req.schedules) {
            results.add(createSchedule(item, actorUserId, ipAddress));
        }
        return results;
    }

    @Transactional
    public ScheduleResponse updateSchedule(Long scheduleId, ScheduleCreateRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        StaffSchedule schedule = staffScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch làm việc ID: " + scheduleId));

        if (req.shiftId != null) schedule.setShiftId(req.shiftId);
        if (req.roomId != null) schedule.setRoomId(req.roomId);
        if (req.workDate != null) schedule.setWorkDate(req.workDate);
        if (req.note != null) schedule.setNote(req.note);

        StaffSchedule saved = staffScheduleRepository.save(schedule);

        auditLogRepository.save(new AuditLog(actorUserId, "UPDATE_SCHEDULE", "staff_schedules", String.valueOf(saved.getId()),
                "{\"staffId\":" + saved.getStaffId() + "}", ipAddress));

        return toScheduleResponse(saved);
    }

    @Transactional
    public void deleteSchedule(Long scheduleId, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        StaffSchedule schedule = staffScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch làm việc ID: " + scheduleId));

        staffScheduleRepository.delete(schedule);

        auditLogRepository.save(new AuditLog(actorUserId, "DELETE_SCHEDULE", "staff_schedules", String.valueOf(scheduleId),
                "{\"staffId\":" + schedule.getStaffId() + ",\"date\":\"" + schedule.getWorkDate() + "\"}", ipAddress));
    }

    public List<ScheduleResponse> getSchedules(LocalDate startDate, LocalDate endDate, Long departmentId, Long staffId, Long roomId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(3);
        LocalDate end = endDate != null ? endDate : LocalDate.now().plusDays(14);

        List<StaffSchedule> list = staffScheduleRepository.findByWorkDateBetweenOrderByWorkDateAscShiftIdAsc(start, end);

        Map<Long, Staff> staffMap = staffRepository.findAll().stream().collect(Collectors.toMap(Staff::getId, s -> s, (a, b) -> a));

        return list.stream().filter(s -> {
            if (staffId != null && staffId > 0 && !staffId.equals(s.getStaffId())) return false;
            if (roomId != null && roomId > 0 && !roomId.equals(s.getRoomId())) return false;
            if (departmentId != null && departmentId > 0) {
                Staff st = staffMap.get(s.getStaffId());
                if (st == null || !departmentId.equals(st.getDepartmentId())) return false;
            }
            return true;
        }).map(this::toScheduleResponse).collect(Collectors.toList());
    }

    private ScheduleResponse toScheduleResponse(StaffSchedule s) {
        ScheduleResponse res = new ScheduleResponse();
        res.id = s.getId();
        res.staffId = s.getStaffId();
        res.shiftId = s.getShiftId();
        res.roomId = s.getRoomId();
        res.workDate = s.getWorkDate();
        res.note = s.getNote();
        res.status = s.getStatus();
        res.createdAt = s.getCreatedAt();

        staffRepository.findById(s.getStaffId()).ifPresent(st -> {
            res.staffCode = st.getStaffCode();
            res.staffName = st.getFullName();
            res.qualification = st.getQualification();
            res.departmentId = st.getDepartmentId();
            if (st.getDepartmentId() != null) {
                departmentRepository.findById(st.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
            }
            if (st.getUserId() != null) {
                userRepository.findById(st.getUserId()).ifPresent(u -> {
                    if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                        res.staffRole = u.getRoles().iterator().next().getName();
                    }
                });
            }
        });

        workShiftRepository.findById(s.getShiftId()).ifPresent(ws -> {
            res.shiftName = ws.getName();
            res.shiftStartTime = ws.getStartTime();
            res.shiftEndTime = ws.getEndTime();
        });

        if (s.getRoomId() != null) {
            clinicRoomRepository.findById(s.getRoomId()).ifPresent(r -> {
                res.roomNumber = r.getRoomNumber();
                res.roomName = r.getName();
            });
        }

        return res;
    }

    // =========================================================================
    // UC-NS06: Đăng ký nghỉ / đổi ca (Tác nhân: Bác sĩ / Nhân viên)
    // =========================================================================
    @Transactional
    public LeaveSwapResponse createLeaveSwapRequest(LeaveSwapCreateRequest req, Long actorUserId, String ipAddress) {
        Staff staff = staffRepository.findByUserId(actorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Chỉ nhân sự nội bộ có hồ sơ mới có thể đăng ký nghỉ hoặc đổi ca."));

        if (req.reason == null || req.reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng ghi rõ lý do xin nghỉ hoặc đổi ca.");
        }

        String type = req.requestType != null ? req.requestType.toUpperCase() : "LEAVE";

        LeaveSwapRequest lsr = new LeaveSwapRequest();
        lsr.setStaffId(staff.getId());
        lsr.setRequestType(type);
        lsr.setScheduleId(req.scheduleId);
        lsr.setLeaveDate(req.leaveDate);
        lsr.setTargetStaffId(req.targetStaffId);
        lsr.setTargetDate(req.targetDate);
        lsr.setTargetShiftId(req.targetShiftId);
        lsr.setReason(req.reason.trim());
        lsr.setStatus("PENDING");

        LeaveSwapRequest saved = leaveSwapRequestRepository.save(lsr);

        auditLogRepository.save(new AuditLog(actorUserId, "SUBMIT_LEAVE_SWAP_REQUEST", "leave_swap_requests", String.valueOf(saved.getId()),
                "{\"type\":\"" + saved.getRequestType() + "\",\"staffId\":" + staff.getId() + "}", ipAddress));

        return toLeaveSwapResponse(saved);
    }

    public List<LeaveSwapResponse> getLeaveSwapRequests(Long actorUserId, String status) {
        boolean isManager = authService.isAdminOrManager(actorUserId);
        List<LeaveSwapRequest> list;

        if (isManager) {
            list = leaveSwapRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            Staff staff = staffRepository.findByUserId(actorUserId).orElse(null);
            if (staff == null) return Collections.emptyList();
            list = leaveSwapRequestRepository.findByStaffIdOrderByCreatedAtDesc(staff.getId());
        }

        return list.stream().filter(r -> {
            if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                return status.equalsIgnoreCase(r.getStatus());
            }
            return true;
        }).map(this::toLeaveSwapResponse).collect(Collectors.toList());
    }

    @Transactional
    public LeaveSwapResponse reviewLeaveSwapRequest(Long requestId, LeaveSwapReviewRequest req, Long actorUserId, String ipAddress) {
        authService.validateAdminOrManager(actorUserId);

        LeaveSwapRequest lsr = leaveSwapRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu nghỉ/đổi ca ID: " + requestId));

        String newStatus = req.status != null ? req.status.toUpperCase() : "APPROVED";
        lsr.setStatus(newStatus);
        lsr.setReviewerId(actorUserId);
        lsr.setReviewNote(req.reviewNote);
        lsr.setReviewedAt(LocalDateTime.now());

        // Nếu duyệt, tự động xử lý cập nhật lịch trực
        if ("APPROVED".equalsIgnoreCase(newStatus)) {
            if ("LEAVE".equalsIgnoreCase(lsr.getRequestType())) {
                if (lsr.getScheduleId() != null) {
                    staffScheduleRepository.findById(lsr.getScheduleId()).ifPresent(s -> {
                        s.setStatus("CANCELLED");
                        s.setNote("Đã duyệt nghỉ phép: " + lsr.getReason());
                        staffScheduleRepository.save(s);
                    });
                }
            } else if ("SWAP".equalsIgnoreCase(lsr.getRequestType())) {
                // Đổi ca
                if (lsr.getScheduleId() != null && lsr.getTargetStaffId() != null) {
                    staffScheduleRepository.findById(lsr.getScheduleId()).ifPresent(s -> {
                        s.setStaffId(lsr.getTargetStaffId());
                        s.setNote("Đã đổi ca từ nhân viên ID " + lsr.getStaffId());
                        staffScheduleRepository.save(s);
                    });
                }
            }
        }

        LeaveSwapRequest saved = leaveSwapRequestRepository.save(lsr);

        auditLogRepository.save(new AuditLog(actorUserId, "REVIEW_LEAVE_SWAP_REQUEST", "leave_swap_requests", String.valueOf(saved.getId()),
                "{\"status\":\"" + newStatus + "\"}", ipAddress));

        return toLeaveSwapResponse(saved);
    }

    private LeaveSwapResponse toLeaveSwapResponse(LeaveSwapRequest r) {
        LeaveSwapResponse res = new LeaveSwapResponse();
        res.id = r.getId();
        res.staffId = r.getStaffId();
        res.requestType = r.getRequestType();
        res.scheduleId = r.getScheduleId();
        res.leaveDate = r.getLeaveDate();
        res.targetStaffId = r.getTargetStaffId();
        res.targetDate = r.getTargetDate();
        res.targetShiftId = r.getTargetShiftId();
        res.reason = r.getReason();
        res.status = r.getStatus();
        res.reviewerId = r.getReviewerId();
        res.reviewNote = r.getReviewNote();
        res.reviewedAt = r.getReviewedAt();
        res.createdAt = r.getCreatedAt();

        staffRepository.findById(r.getStaffId()).ifPresent(s -> {
            res.staffName = s.getFullName();
            res.staffCode = s.getStaffCode();
        });

        if (r.getTargetStaffId() != null) {
            staffRepository.findById(r.getTargetStaffId()).ifPresent(s -> res.targetStaffName = s.getFullName());
        }

        if (r.getTargetShiftId() != null) {
            workShiftRepository.findById(r.getTargetShiftId()).ifPresent(ws -> res.targetShiftName = ws.getName());
        }

        if (r.getScheduleId() != null) {
            staffScheduleRepository.findById(r.getScheduleId()).ifPresent(s -> {
                res.currentWorkDate = s.getWorkDate();
                workShiftRepository.findById(s.getShiftId()).ifPresent(ws -> res.currentShiftName = ws.getName());
                if (s.getRoomId() != null) {
                    clinicRoomRepository.findById(s.getRoomId()).ifPresent(rm -> res.currentRoomName = rm.getName());
                }
            });
        }

        if (r.getReviewerId() != null) {
            userRepository.findById(r.getReviewerId()).ifPresent(u -> res.reviewerName = u.getUsername());
        }

        return res;
    }

    // =========================================================================
    // UC-NS07: Chấm công (Tác nhân: Nhân viên)
    // =========================================================================
    @Transactional
    public AttendanceResponse checkIn(Long actorUserId, AttendanceCheckInRequest req, String ipAddress) {
        Staff staff = staffRepository.findByUserId(actorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được liên kết hồ sơ nhân viên để thực hiện chấm công."));

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra đã chấm công hôm nay chưa
        Optional<Attendance> existingOpt = attendanceRepository.findByStaffIdAndAttendanceDate(staff.getId(), today);
        if (existingOpt.isPresent()) {
            Attendance existing = existingOpt.get();
            if (existing.getCheckInTime() != null) {
                return toAttendanceResponse(existing);
            }
        }

        // Tìm lịch làm việc hôm nay để xác định ca và giờ bắt đầu
        List<StaffSchedule> schedules = staffScheduleRepository.findByStaffIdAndWorkDate(staff.getId(), today);
        StaffSchedule schedule = schedules.isEmpty() ? null : schedules.get(0);

        String status = "ON_TIME";
        if (schedule != null) {
            WorkShift shift = workShiftRepository.findById(schedule.getShiftId()).orElse(null);
            if (shift != null) {
                LocalTime expectedStart = shift.getStartTime();
                // Ân hạn 15 phút
                if (now.toLocalTime().isAfter(expectedStart.plusMinutes(15))) {
                    status = "LATE";
                }
            }
        }

        Attendance attendance = existingOpt.orElseGet(() -> {
            Attendance att = new Attendance();
            att.setStaffId(staff.getId());
            att.setAttendanceDate(today);
            return att;
        });

        attendance.setScheduleId(schedule != null ? schedule.getId() : null);
        attendance.setCheckInTime(now);
        attendance.setStatus(status);
        if (req != null && req.notes != null) attendance.setNotes(req.notes);

        Attendance saved = attendanceRepository.save(attendance);

        auditLogRepository.save(new AuditLog(actorUserId, "CHECK_IN", "attendances", String.valueOf(saved.getId()),
                "{\"status\":\"" + status + "\"}", ipAddress));

        return toAttendanceResponse(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(Long actorUserId, AttendanceCheckOutRequest req, String ipAddress) {
        Staff staff = staffRepository.findByUserId(actorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được liên kết hồ sơ nhân viên."));

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Attendance attendance = attendanceRepository.findByStaffIdAndAttendanceDate(staff.getId(), today)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa thực hiện Check-in vào ca hôm nay."));

        attendance.setCheckOutTime(now);

        // Kiểm tra về sớm nếu có ca
        if (attendance.getScheduleId() != null) {
            staffScheduleRepository.findById(attendance.getScheduleId()).ifPresent(s -> {
                workShiftRepository.findById(s.getShiftId()).ifPresent(shift -> {
                    LocalTime expectedEnd = shift.getEndTime();
                    if (now.toLocalTime().isBefore(expectedEnd.minusMinutes(15))) {
                        if ("LATE".equalsIgnoreCase(attendance.getStatus())) {
                            attendance.setStatus("LATE_AND_EARLY_LEAVE");
                        } else {
                            attendance.setStatus("EARLY_LEAVE");
                        }
                    }
                });
            });
        }

        if (req != null && req.notes != null) {
            attendance.setNotes((attendance.getNotes() != null ? attendance.getNotes() + " | " : "") + req.notes);
        }

        Attendance saved = attendanceRepository.save(attendance);

        auditLogRepository.save(new AuditLog(actorUserId, "CHECK_OUT", "attendances", String.valueOf(saved.getId()),
                "{\"checkOut\":\"" + now + "\"}", ipAddress));

        return toAttendanceResponse(saved);
    }

    public List<AttendanceResponse> getMyAttendance(Long actorUserId, LocalDate startDate, LocalDate endDate) {
        Staff staff = staffRepository.findByUserId(actorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ nhân viên cho tài khoản hiện tại."));

        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        return attendanceRepository.findByStaffIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(staff.getId(), start, end)
                .stream().map(this::toAttendanceResponse).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getAllAttendances(LocalDate startDate, LocalDate endDate, Long departmentId, Long staffId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(7);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Attendance> list = attendanceRepository.findByAttendanceDateBetweenOrderByAttendanceDateDesc(start, end);
        Map<Long, Staff> staffMap = staffRepository.findAll().stream().collect(Collectors.toMap(Staff::getId, s -> s, (a, b) -> a));

        return list.stream().filter(a -> {
            if (staffId != null && staffId > 0 && !staffId.equals(a.getStaffId())) return false;
            if (departmentId != null && departmentId > 0) {
                Staff s = staffMap.get(a.getStaffId());
                if (s == null || !departmentId.equals(s.getDepartmentId())) return false;
            }
            return true;
        }).map(this::toAttendanceResponse).collect(Collectors.toList());
    }

    private AttendanceResponse toAttendanceResponse(Attendance a) {
        AttendanceResponse res = new AttendanceResponse();
        res.id = a.getId();
        res.staffId = a.getStaffId();
        res.scheduleId = a.getScheduleId();
        res.attendanceDate = a.getAttendanceDate();
        res.checkInTime = a.getCheckInTime();
        res.checkOutTime = a.getCheckOutTime();
        res.status = a.getStatus();
        res.notes = a.getNotes();

        staffRepository.findById(a.getStaffId()).ifPresent(s -> {
            res.staffCode = s.getStaffCode();
            res.staffName = s.getFullName();
            if (s.getDepartmentId() != null) {
                departmentRepository.findById(s.getDepartmentId()).ifPresent(d -> res.departmentName = d.getName());
            }
        });

        if (a.getScheduleId() != null) {
            staffScheduleRepository.findById(a.getScheduleId()).ifPresent(s -> {
                workShiftRepository.findById(s.getShiftId()).ifPresent(ws -> {
                    res.shiftName = ws.getName();
                    res.expectedStartTime = ws.getStartTime();
                    res.expectedEndTime = ws.getEndTime();
                });
            });
        }

        return res;
    }
}
