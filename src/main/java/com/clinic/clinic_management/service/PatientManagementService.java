package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.PatientDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PatientManagementService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private ClinicRoomRepository clinicRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * UC-BN01: Đăng ký hồ sơ bệnh nhân mới
     * Tác nhân: Lễ tân, Bệnh nhân (tự đăng ký), Quản lý, Admin.
     */
    @Transactional
    public PatientDetailDto createPatient(CreatePatientRequest request, Long requesterId, String ipAddress) {
        validateRequesterForCreate(requesterId);

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên bệnh nhân không được để trống.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại liên hệ là thông tin bắt buộc.");
        }
        if (request.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Ngày sinh của bệnh nhân không được để trống.");
        }
        if (request.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày sinh không thể lớn hơn ngày hiện tại.");
        }
        if (request.getGender() == null || request.getGender().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn giới tính (Nam, Nữ hoặc Khác).");
        }

        String phone = request.getPhone().trim();
        Optional<Patient> existingByPhone = patientRepository.findByPhone(phone);
        if (existingByPhone.isPresent() && Boolean.TRUE.equals(existingByPhone.get().getIsActive())) {
            throw new IllegalArgumentException("Số điện thoại '" + phone + "' đã tồn tại trong hồ sơ bệnh nhân mang mã "
                    + existingByPhone.get().getPatientCode() + ". Vui lòng kiểm tra lại để tránh tạo hồ sơ trùng lặp.");
        }

        if (request.getIdentityCard() != null && !request.getIdentityCard().trim().isEmpty()) {
            String cccd = request.getIdentityCard().trim();
            Optional<Patient> existingByCccd = patientRepository.findByIdentityCard(cccd);
            if (existingByCccd.isPresent() && Boolean.TRUE.equals(existingByCccd.get().getIsActive())) {
                throw new IllegalArgumentException("Số CCCD/Hộ chiếu '" + cccd + "' đã được đăng ký cho bệnh nhân "
                        + existingByCccd.get().getPatientCode() + " (" + existingByCccd.get().getFullName() + ").");
            }
        }

        Patient patient = new Patient();
        patient.setPatientCode(generateNextPatientCode());
        patient.setFullName(request.getFullName().trim());
        patient.setGender(request.getGender().trim().toUpperCase());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setPhone(phone);
        patient.setEmail(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null);
        patient.setIdentityCard(request.getIdentityCard() != null && !request.getIdentityCard().trim().isEmpty() ? request.getIdentityCard().trim() : null);
        patient.setHealthInsuranceNumber(request.getHealthInsuranceNumber() != null && !request.getHealthInsuranceNumber().trim().isEmpty() ? request.getHealthInsuranceNumber().trim().toUpperCase() : null);
        patient.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        patient.setEmergencyContactName(request.getEmergencyContactName() != null ? request.getEmergencyContactName().trim() : null);
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone() != null ? request.getEmergencyContactPhone().trim() : null);
        patient.setBloodGroup(request.getBloodGroup() != null && !request.getBloodGroup().trim().isEmpty() ? request.getBloodGroup().trim() : "UNKNOWN");
        patient.setMedicalHistory(request.getMedicalHistory() != null ? request.getMedicalHistory().trim() : null);
        patient.setDrugAllergies(request.getDrugAllergies() != null ? request.getDrugAllergies().trim() : null);
        patient.setIsActive(true);

        // If requester is a patient user creating own profile, or specific userId provided
        if (request.getUserId() != null) {
            patient.setUserId(request.getUserId());
        } else if (requesterId != null && isPatientUser(requesterId)) {
            patient.setUserId(requesterId);
        }

        Patient saved = patientRepository.save(patient);

        // Audit Log
        Long actorId = requesterId != null ? requesterId : (saved.getUserId() != null ? saved.getUserId() : 1L);
        auditLogRepository.save(new AuditLog(
                actorId,
                "CREATE_PATIENT",
                "patients",
                String.valueOf(saved.getId()),
                "{\"patientCode\":\"" + saved.getPatientCode() + "\",\"fullName\":\"" + saved.getFullName() + "\"}",
                ipAddress
        ));

        return toPatientDetailDto(saved);
    }

    /**
     * UC-BN02: Tìm kiếm bệnh nhân theo tên, số điện thoại, mã hồ sơ
     * Tác nhân: Lễ tân, Bác sĩ, Điều dưỡng, Quản lý, Admin.
     */
    public List<PatientDetailDto> searchPatients(String keyword, Boolean activeOnly, Long requesterId) {
        validateStaffAccess(requesterId, "tìm kiếm hồ sơ bệnh nhân");

        boolean filterActive = activeOnly == null || activeOnly;
        String searchKey = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : "";

        List<Patient> patients = patientRepository.searchPatients(searchKey, filterActive);
        return patients.stream().map(this::toPatientDetailDto).collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết hồ sơ bệnh nhân theo ID
     */
    public PatientDetailDto getPatientById(Long id, Long requesterId) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có mã định danh: " + id));

        validateViewAccess(requesterId, patient);
        return toPatientDetailDto(patient);
    }

    /**
     * Lấy hồ sơ bệnh nhân của tài khoản đang đăng nhập (dành cho Bệnh nhân)
     */
    public Optional<PatientDetailDto> getMyPatientProfile(Long userId) {
        if (userId == null) return Optional.empty();
        return patientRepository.findByUserId(userId).map(this::toPatientDetailDto);
    }

    /**
     * UC-BN03: Cập nhật thông tin hành chính bệnh nhân
     * Tác nhân: Lễ tân, Quản lý, Admin.
     */
    @Transactional
    public PatientDetailDto updatePatient(Long id, UpdatePatientRequest request, Long requesterId, String ipAddress) {
        validateReceptionistOrAdmin(requesterId, "cập nhật thông tin hành chính bệnh nhân");

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có ID: " + id));

        if (Boolean.FALSE.equals(patient.getIsActive())) {
            throw new IllegalStateException("Hồ sơ bệnh nhân này đang bị vô hiệu hóa hoặc đã gộp. Vui lòng kích hoạt lại trước khi chỉnh sửa.");
        }

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên bệnh nhân không được để trống.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại liên hệ không được để trống.");
        }
        if (request.getDateOfBirth() != null && request.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày sinh không thể lớn hơn ngày hiện tại.");
        }

        String phone = request.getPhone().trim();
        Optional<Patient> existingPhone = patientRepository.findByPhone(phone);
        if (existingPhone.isPresent() && !existingPhone.get().getId().equals(id) && Boolean.TRUE.equals(existingPhone.get().getIsActive())) {
            throw new IllegalArgumentException("Số điện thoại '" + phone + "' đang thuộc về một hồ sơ bệnh nhân khác ("
                    + existingPhone.get().getPatientCode() + ").");
        }

        patient.setFullName(request.getFullName().trim());
        if (request.getGender() != null) patient.setGender(request.getGender().trim().toUpperCase());
        if (request.getDateOfBirth() != null) patient.setDateOfBirth(request.getDateOfBirth());
        patient.setPhone(phone);
        patient.setEmail(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null);
        patient.setIdentityCard(request.getIdentityCard() != null && !request.getIdentityCard().trim().isEmpty() ? request.getIdentityCard().trim() : null);
        patient.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        patient.setEmergencyContactName(request.getEmergencyContactName() != null ? request.getEmergencyContactName().trim() : null);
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone() != null ? request.getEmergencyContactPhone().trim() : null);
        patient.setUpdatedAt(LocalDateTime.now());

        Patient saved = patientRepository.save(patient);

        auditLogRepository.save(new AuditLog(
                requesterId,
                "UPDATE_PATIENT_INFO",
                "patients",
                String.valueOf(saved.getId()),
                "{\"patientCode\":\"" + saved.getPatientCode() + "\"}",
                ipAddress
        ));

        return toPatientDetailDto(saved);
    }

    /**
     * UC-BN04: Quản lý tiền sử bệnh và dị ứng
     * Tác nhân: Bác sĩ (chuyên môn khám chữa bệnh), Quản lý, Admin.
     */
    @Transactional
    public PatientDetailDto updateMedicalHistory(Long id, UpdateMedicalHistoryRequest request, Long requesterId, String ipAddress) {
        validateDoctorOrAdmin(requesterId, "cập nhật tiền sử bệnh và tiền sử dị ứng thuốc");

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có ID: " + id));

        if (Boolean.FALSE.equals(patient.getIsActive())) {
            throw new IllegalStateException("Hồ sơ bệnh nhân đang bị vô hiệu hóa hoặc đã gộp.");
        }

        if (request.getBloodGroup() != null && !request.getBloodGroup().trim().isEmpty()) {
            patient.setBloodGroup(request.getBloodGroup().trim());
        }
        patient.setMedicalHistory(request.getMedicalHistory() != null ? request.getMedicalHistory().trim() : null);
        patient.setDrugAllergies(request.getDrugAllergies() != null ? request.getDrugAllergies().trim() : null);
        patient.setUpdatedAt(LocalDateTime.now());

        Patient saved = patientRepository.save(patient);

        auditLogRepository.save(new AuditLog(
                requesterId,
                "UPDATE_MEDICAL_HISTORY",
                "patients",
                String.valueOf(saved.getId()),
                "{\"bloodGroup\":\"" + saved.getBloodGroup() + "\",\"updatedByDoctorId\":" + requesterId + "}",
                ipAddress
        ));

        return toPatientDetailDto(saved);
    }

    /**
     * UC-BN05: Cập nhật thông tin bảo hiểm y tế
     * Tác nhân: Lễ tân, Quản lý, Admin.
     */
    @Transactional
    public PatientDetailDto updateInsurance(Long id, UpdateInsuranceRequest request, Long requesterId, String ipAddress) {
        validateReceptionistOrAdmin(requesterId, "cập nhật thông tin thẻ bảo hiểm y tế");

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có ID: " + id));

        if (Boolean.FALSE.equals(patient.getIsActive())) {
            throw new IllegalStateException("Hồ sơ bệnh nhân đang bị vô hiệu hóa hoặc đã gộp.");
        }

        String bhyt = (request.getHealthInsuranceNumber() != null && !request.getHealthInsuranceNumber().trim().isEmpty())
                ? request.getHealthInsuranceNumber().trim().toUpperCase() : null;
        patient.setHealthInsuranceNumber(bhyt);
        patient.setUpdatedAt(LocalDateTime.now());

        Patient saved = patientRepository.save(patient);

        auditLogRepository.save(new AuditLog(
                requesterId,
                "UPDATE_HEALTH_INSURANCE",
                "patients",
                String.valueOf(saved.getId()),
                "{\"healthInsuranceNumber\":\"" + (bhyt != null ? bhyt : "") + "\"}",
                ipAddress
        ));

        return toPatientDetailDto(saved);
    }

    /**
     * UC-BN06: Xem lịch sử khám bệnh
     * Tác nhân: Bác sĩ, Lễ tân, Điều dưỡng, Quản lý, Admin, Bệnh nhân (xem hồ sơ của chính mình).
     */
    public List<MedicalRecordSummaryDto> getPatientMedicalRecords(Long patientId, Long requesterId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có ID: " + patientId));

        validateViewAccess(requesterId, patient);

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

        Map<Long, Staff> staffCache = new HashMap<>();
        Map<Long, ClinicRoom> roomCache = new HashMap<>();

        return records.stream().map(rec -> {
            MedicalRecordSummaryDto dto = new MedicalRecordSummaryDto();
            dto.setId(rec.getId());
            dto.setRecordCode(rec.getRecordCode());
            dto.setPatientId(rec.getPatientId());
            dto.setDoctorId(rec.getDoctorId());
            dto.setRoomId(rec.getRoomId());
            dto.setChiefComplaint(rec.getChiefComplaint());
            dto.setHistoryOfPresentIllness(rec.getHistoryOfPresentIllness());
            dto.setPhysicalExamination(rec.getPhysicalExamination());
            dto.setInitialDiagnosis(rec.getInitialDiagnosis());
            dto.setFinalDiagnosis(rec.getFinalDiagnosis());
            dto.setIcd10Code(rec.getIcd10Code());
            dto.setDoctorAdvice(rec.getDoctorAdvice());
            dto.setFollowUpDate(rec.getFollowUpDate());
            dto.setStatus(rec.getStatus());
            dto.setCreatedAt(rec.getCreatedAt());

            Staff staff = staffCache.computeIfAbsent(rec.getDoctorId(), did -> staffRepository.findById(did).orElse(null));
            if (staff != null) {
                dto.setDoctorName(staff.getFullName());
                dto.setDoctorQualification(staff.getQualification());
            }

            ClinicRoom room = roomCache.computeIfAbsent(rec.getRoomId(), rid -> clinicRoomRepository.findById(rid).orElse(null));
            if (room != null) {
                dto.setRoomName(room.getName());
                dto.setRoomNumber(room.getRoomNumber());
            }

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * UC-BN07: Gộp hồ sơ trùng
     * Tác nhân: Quản lý phòng khám, Quản trị viên hệ thống.
     */
    @Transactional
    public PatientDetailDto mergePatients(MergePatientRequest request, Long requesterId, String ipAddress) {
        validateManagerOrAdmin(requesterId, "gộp hồ sơ bệnh nhân trùng lặp");

        Long primaryId = request.getPrimaryPatientId();
        Long duplicateId = request.getDuplicatePatientId();

        if (primaryId == null || duplicateId == null) {
            throw new IllegalArgumentException("Vui lòng chọn đầy đủ Hồ sơ gốc và Hồ sơ trùng lặp cần gộp.");
        }
        if (primaryId.equals(duplicateId)) {
            throw new IllegalArgumentException("Hồ sơ gốc và hồ sơ trùng lặp phải là hai hồ sơ khác nhau.");
        }

        Patient primary = patientRepository.findById(primaryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ gốc có ID: " + primaryId));

        Patient duplicate = patientRepository.findById(duplicateId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ trùng có ID: " + duplicateId));

        if (duplicate.getMergedIntoId() != null) {
            throw new IllegalStateException("Hồ sơ '" + duplicate.getPatientCode() + "' đã được gộp vào hồ sơ khác trước đó.");
        }

        // Transfer all related records from duplicate to primary
        medicalRecordRepository.reassignPatient(duplicateId, primaryId);

        // Native update for appointments, queue_tickets, vital_signs if any
        try {
            entityManager.createNativeQuery("UPDATE appointments SET patient_id = :primaryId WHERE patient_id = :dupId")
                    .setParameter("primaryId", primaryId)
                    .setParameter("dupId", duplicateId)
                    .executeUpdate();
            entityManager.createNativeQuery("UPDATE queue_tickets SET patient_id = :primaryId WHERE patient_id = :dupId")
                    .setParameter("primaryId", primaryId)
                    .setParameter("dupId", duplicateId)
                    .executeUpdate();
            entityManager.createNativeQuery("UPDATE vital_signs SET patient_id = :primaryId WHERE patient_id = :dupId")
                    .setParameter("primaryId", primaryId)
                    .setParameter("dupId", duplicateId)
                    .executeUpdate();
        } catch (Exception ignored) {
            // Some optional tables may be empty
        }

        // Merge supplemental info into primary if primary was missing it
        if ((primary.getEmail() == null || primary.getEmail().isEmpty()) && duplicate.getEmail() != null) {
            primary.setEmail(duplicate.getEmail());
        }
        if ((primary.getHealthInsuranceNumber() == null || primary.getHealthInsuranceNumber().isEmpty()) && duplicate.getHealthInsuranceNumber() != null) {
            primary.setHealthInsuranceNumber(duplicate.getHealthInsuranceNumber());
        }
        if ((primary.getIdentityCard() == null || primary.getIdentityCard().isEmpty()) && duplicate.getIdentityCard() != null) {
            primary.setIdentityCard(duplicate.getIdentityCard());
        }
        if ((primary.getAddress() == null || primary.getAddress().isEmpty()) && duplicate.getAddress() != null) {
            primary.setAddress(duplicate.getAddress());
        }
        if ((primary.getEmergencyContactName() == null || primary.getEmergencyContactName().isEmpty()) && duplicate.getEmergencyContactName() != null) {
            primary.setEmergencyContactName(duplicate.getEmergencyContactName());
            primary.setEmergencyContactPhone(duplicate.getEmergencyContactPhone());
        }
        if ((primary.getMedicalHistory() == null || primary.getMedicalHistory().isEmpty()) && duplicate.getMedicalHistory() != null) {
            primary.setMedicalHistory(duplicate.getMedicalHistory());
        }
        if ((primary.getDrugAllergies() == null || primary.getDrugAllergies().isEmpty()) && duplicate.getDrugAllergies() != null) {
            primary.setDrugAllergies(duplicate.getDrugAllergies());
        }

        primary.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(primary);

        // Mark duplicate patient as inactive and merged
        duplicate.setIsActive(false);
        duplicate.setMergedIntoId(primaryId);
        duplicate.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(duplicate);

        auditLogRepository.save(new AuditLog(
                requesterId,
                "MERGE_PATIENTS",
                "patients",
                String.valueOf(primaryId),
                "{\"primaryCode\":\"" + primary.getPatientCode() + "\",\"duplicateCode\":\"" + duplicate.getPatientCode() + "\",\"note\":\"" + (request.getNote() != null ? request.getNote() : "") + "\"}",
                ipAddress
        ));

        return toPatientDetailDto(primary);
    }

    /**
     * UC-BN07: Vô hiệu hóa / Kích hoạt lại hồ sơ bệnh nhân
     * Tác nhân: Quản lý phòng khám, Quản trị viên hệ thống.
     */
    @Transactional
    public PatientDetailDto togglePatientActive(Long id, ToggleActiveRequest request, Long requesterId, String ipAddress) {
        validateManagerOrAdmin(requesterId, "vô hiệu hóa hoặc kích hoạt hồ sơ bệnh nhân");

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ bệnh nhân có ID: " + id));

        if (patient.getMergedIntoId() != null) {
            throw new IllegalStateException("Hồ sơ bệnh nhân này đã được gộp vào hồ sơ " + patient.getMergedIntoId() + " và không thể thay đổi trạng thái trực tiếp.");
        }

        boolean newStatus = request.getIsActive() != null ? request.getIsActive() : !Boolean.TRUE.equals(patient.getIsActive());
        patient.setIsActive(newStatus);
        patient.setUpdatedAt(LocalDateTime.now());

        Patient saved = patientRepository.save(patient);

        auditLogRepository.save(new AuditLog(
                requesterId,
                newStatus ? "ACTIVATE_PATIENT" : "DEACTIVATE_PATIENT",
                "patients",
                String.valueOf(saved.getId()),
                "{\"patientCode\":\"" + saved.getPatientCode() + "\",\"reason\":\"" + (request.getReason() != null ? request.getReason() : "") + "\"}",
                ipAddress
        ));

        return toPatientDetailDto(saved);
    }

    // --- Helper & Mapping methods ---

    public PatientDetailDto toPatientDetailDto(Patient p) {
        PatientDetailDto dto = new PatientDetailDto();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setPatientCode(p.getPatientCode());
        dto.setFullName(p.getFullName());
        dto.setGender(p.getGender());
        dto.setDateOfBirth(p.getDateOfBirth());
        if (p.getDateOfBirth() != null) {
            dto.setAge(Period.between(p.getDateOfBirth(), LocalDate.now()).getYears());
        }
        dto.setPhone(p.getPhone());
        dto.setEmail(p.getEmail());
        dto.setIdentityCard(p.getIdentityCard());
        dto.setHealthInsuranceNumber(p.getHealthInsuranceNumber());
        dto.setAddress(p.getAddress());
        dto.setEmergencyContactName(p.getEmergencyContactName());
        dto.setEmergencyContactPhone(p.getEmergencyContactPhone());
        dto.setBloodGroup(p.getBloodGroup());
        dto.setMedicalHistory(p.getMedicalHistory());
        dto.setDrugAllergies(p.getDrugAllergies());
        dto.setIsActive(p.getIsActive());
        dto.setMergedIntoId(p.getMergedIntoId());
        if (p.getMergedIntoId() != null) {
            patientRepository.findById(p.getMergedIntoId()).ifPresent(mp -> dto.setMergedIntoCode(mp.getPatientCode()));
        }
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        dto.setTotalVisits(medicalRecordRepository.countByPatientId(p.getId()));
        return dto;
    }

    private synchronized String generateNextPatientCode() {
        int currentYear = LocalDate.now().getYear();
        String prefix = "BN" + currentYear;

        Optional<Patient> topPatient = patientRepository.findTopByOrderByIdDesc();
        long nextSeq = 1;
        if (topPatient.isPresent() && topPatient.get().getPatientCode() != null) {
            String code = topPatient.get().getPatientCode();
            if (code.startsWith(prefix)) {
                try {
                    String numberPart = code.substring(prefix.length());
                    nextSeq = Long.parseLong(numberPart) + 1;
                } catch (Exception ignored) {
                    nextSeq = topPatient.get().getId() + 1;
                }
            } else {
                nextSeq = topPatient.get().getId() + 1;
            }
        }
        String generated = String.format("%s%04d", prefix, nextSeq);
        while (patientRepository.existsByPatientCode(generated)) {
            nextSeq++;
            generated = String.format("%s%04d", prefix, nextSeq);
        }
        return generated;
    }

    private boolean isPatientUser(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId)
                .map(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> "patient".equalsIgnoreCase(r.getCode())))
                .orElse(false);
    }

    private boolean hasAnyRole(Long userId, String... roles) {
        if (userId == null) return false;
        return userRepository.findById(userId)
                .map(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> {
                            String code = r.getCode().toLowerCase();
                            for (String role : roles) {
                                if (role.equalsIgnoreCase(code)) return true;
                            }
                            return false;
                        }))
                .orElse(false);
    }

    private void validateRequesterForCreate(Long requesterId) {
        if (requesterId == null) {
            // Allowed for public direct registration if system allows, but if authenticated check roles
            return;
        }
        boolean ok = hasAnyRole(requesterId, "receptionist", "doctor", "manager", "admin", "patient");
        if (!ok) {
            throw new SecurityException("Bạn không có quyền đăng ký hồ sơ bệnh nhân mới.");
        }
    }

    private void validateReceptionistOrAdmin(Long requesterId, String actionName) {
        if (requesterId == null || !hasAnyRole(requesterId, "receptionist", "manager", "admin")) {
            throw new SecurityException("Truy cập bị từ chối: Chỉ Lễ tân (Receptionist), Quản lý phòng khám hoặc Quản trị viên mới có quyền " + actionName + ".");
        }
    }

    private void validateDoctorOrAdmin(Long requesterId, String actionName) {
        if (requesterId == null || !hasAnyRole(requesterId, "doctor", "manager", "admin")) {
            throw new SecurityException("Truy cập bị từ chối: Chỉ Bác sĩ (Doctor), Quản lý phòng khám hoặc Quản trị viên mới có quyền " + actionName + ".");
        }
    }

    private void validateManagerOrAdmin(Long requesterId, String actionName) {
        if (requesterId == null || !hasAnyRole(requesterId, "manager", "admin")) {
            throw new SecurityException("Truy cập bị từ chối: Chỉ Quản lý phòng khám (Manager) hoặc Quản trị viên mới có quyền " + actionName + ".");
        }
    }

    private void validateStaffAccess(Long requesterId, String actionName) {
        if (requesterId == null || !hasAnyRole(requesterId, "receptionist", "doctor", "nurse", "manager", "admin")) {
            throw new SecurityException("Truy cập bị từ chối: Bạn không có quyền " + actionName + ".");
        }
    }

    private void validateViewAccess(Long requesterId, Patient patient) {
        if (requesterId == null) return; // Allow internal view if needed
        boolean isStaff = hasAnyRole(requesterId, "receptionist", "doctor", "nurse", "technician", "pharmacist", "cashier", "manager", "admin");
        if (isStaff) return;

        // If requester is a patient, they can only view if it's their own linked record
        if (patient.getUserId() != null && patient.getUserId().equals(requesterId)) {
            return;
        }

        // Check if patient's phone matches user's phone
        Optional<User> userOpt = userRepository.findById(requesterId);
        if (userOpt.isPresent() && userOpt.get().getPhone() != null && userOpt.get().getPhone().equals(patient.getPhone())) {
            return;
        }

        throw new SecurityException("Truy cập bị từ chối: Bạn chỉ có quyền xem hồ sơ bệnh án của chính mình.");
    }
}
