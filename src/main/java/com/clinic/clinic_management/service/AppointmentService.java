package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.AppointmentDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderRepository reminderRepository;
    private final PatientRepository patientRepository;
    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final WorkShiftRepository workShiftRepository;
    private final ClinicRoomRepository clinicRoomRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AppointmentReminderRepository reminderRepository,
            PatientRepository patientRepository,
            StaffRepository staffRepository,
            DepartmentRepository departmentRepository,
            DoctorProfileRepository doctorProfileRepository,
            StaffScheduleRepository staffScheduleRepository,
            WorkShiftRepository workShiftRepository,
            ClinicRoomRepository clinicRoomRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.reminderRepository = reminderRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.departmentRepository = departmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.staffScheduleRepository = staffScheduleRepository;
        this.workShiftRepository = workShiftRepository;
        this.clinicRoomRepository = clinicRoomRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * UC-LH01: Xem khung giờ trống của bác sĩ
     * Lấy các slot 30 phút theo ca làm việc (hoặc giờ chuẩn) của bác sĩ trong ngày,
     * đối chiếu với lịch hẹn đã đặt để xác định slot còn trống hay đã kín.
     */
    @Transactional(readOnly = true)
    public DoctorSlotSummaryDto getDoctorAvailableSlots(Long doctorId, LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        Staff doctor = staffRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin bác sĩ với ID: " + doctorId));

        DoctorProfile profile = doctorProfileRepository.findByStaffId(doctorId).orElse(null);
        Department department = doctor.getDepartmentId() != null
                ? departmentRepository.findById(doctor.getDepartmentId()).orElse(null)
                : null;

        // Tìm lịch phân ca của bác sĩ trong ngày
        List<StaffSchedule> schedules = staffScheduleRepository.findByStaffIdAndWorkDate(doctorId, date);
        List<StaffSchedule> activeSchedules = schedules.stream()
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        String roomName = "Phòng khám chung";
        List<DoctorSlotDto> slots = new ArrayList<>();

        // Danh sách các lịch hẹn đã đặt của bác sĩ vào ngày này (chưa hủy)
        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(doctorId, date)
                .stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());

        Set<LocalTime> bookedTimes = bookedAppointments.stream()
                .map(Appointment::getAppointmentTime)
                .collect(Collectors.toSet());

        if (!activeSchedules.isEmpty()) {
            for (StaffSchedule schedule : activeSchedules) {
                WorkShift shift = workShiftRepository.findById(schedule.getShiftId()).orElse(null);
                if (shift == null) continue;

                if (schedule.getRoomId() != null) {
                    ClinicRoom room = clinicRoomRepository.findById(schedule.getRoomId()).orElse(null);
                    if (room != null) {
                        roomName = room.getName() + " (" + room.getRoomNumber() + ")";
                    }
                }

                LocalTime current = shift.getStartTime();
                LocalTime end = shift.getEndTime();

                while (current.plusMinutes(30).isBefore(end) || current.plusMinutes(30).equals(end)) {
                    LocalTime slotStart = current;
                    LocalTime slotEnd = current.plusMinutes(30);
                    boolean isBooked = bookedTimes.contains(slotStart);

                    slots.add(new DoctorSlotDto(
                            slotStart,
                            slotEnd,
                            !isBooked,
                            shift.getName(),
                            doctorId,
                            doctor.getFullName(),
                            department != null ? department.getName() : "Đa khoa",
                            roomName
                    ));

                    current = current.plusMinutes(30);
                }
            }
        } else {
            // Trường hợp bác sĩ chưa có lịch phân ca cụ thể trong bảng staff_schedules,
            // sinh các khung giờ hành chính chuẩn để hỗ trợ đặt hẹn
            List<WorkShift> defaultShifts = workShiftRepository.findAll();
            if (defaultShifts.isEmpty()) {
                defaultShifts = List.of(
                        new WorkShift(1L, "Ca sáng", LocalTime.of(8, 0), LocalTime.of(11, 30)),
                        new WorkShift(2L, "Ca chiều", LocalTime.of(13, 30), LocalTime.of(17, 0))
                );
            }

            for (WorkShift shift : defaultShifts) {
                LocalTime current = shift.getStartTime();
                LocalTime end = shift.getEndTime();

                while (current.plusMinutes(30).isBefore(end) || current.plusMinutes(30).equals(end)) {
                    LocalTime slotStart = current;
                    LocalTime slotEnd = current.plusMinutes(30);
                    boolean isBooked = bookedTimes.contains(slotStart);

                    slots.add(new DoctorSlotDto(
                            slotStart,
                            slotEnd,
                            !isBooked,
                            shift.getName(),
                            doctorId,
                            doctor.getFullName(),
                            department != null ? department.getName() : "Đa khoa",
                            roomName
                    ));

                    current = current.plusMinutes(30);
                }
            }
        }

        // Sắp xếp các slot theo thời gian bắt đầu tăng dần
        slots.sort(Comparator.comparing(DoctorSlotDto::getStartTime));

        DoctorSlotSummaryDto summary = new DoctorSlotSummaryDto();
        summary.setDoctorId(doctor.getId());
        summary.setDoctorName(doctor.getFullName());
        summary.setStaffCode(doctor.getStaffCode());
        summary.setSpecialty(profile != null ? profile.getSpecialty() : "Bác sĩ chuyên khoa");
        summary.setConsultationFee(profile != null ? profile.getConsultationFee() : new BigDecimal("200000"));
        summary.setDepartmentId(department != null ? department.getId() : null);
        summary.setDepartmentName(department != null ? department.getName() : "Đa khoa");
        summary.setWorkDate(date);
        summary.setRoomName(roomName);
        summary.setSlots(slots);

        return summary;
    }

    /**
     * Danh sách bác sĩ có thể đặt lịch theo ngày và chuyên khoa
     */
    @Transactional(readOnly = true)
    public List<DoctorOptionDto> getAvailableDoctors(LocalDate date, Long departmentId) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<Staff> staffList = staffRepository.findAll();
        List<DoctorOptionDto> doctorOptions = new ArrayList<>();
        Set<String> seenCodes = new HashSet<>();

        for (Staff staff : staffList) {
            if (staff.getStatus() != null && !"ACTIVE".equalsIgnoreCase(staff.getStatus())) {
                continue;
            }
            if (staff.getStaffCode() != null && !seenCodes.add(staff.getStaffCode().trim().toUpperCase())) {
                continue;
            }

            DoctorProfile profile = doctorProfileRepository.findByStaffId(staff.getId()).orElse(null);
            if (profile == null && !staff.getStaffCode().toUpperCase().startsWith("BS")) {
                continue;
            }

            if (departmentId != null && staff.getDepartmentId() != null && !staff.getDepartmentId().equals(departmentId)) {
                continue;
            }

            Department dept = staff.getDepartmentId() != null
                    ? departmentRepository.findById(staff.getDepartmentId()).orElse(null)
                    : null;

            List<StaffSchedule> schedules = staffScheduleRepository.findByStaffIdAndWorkDate(staff.getId(), date);
            List<String> shiftsToday = new ArrayList<>();
            for (StaffSchedule sc : schedules) {
                if (!"CANCELLED".equalsIgnoreCase(sc.getStatus())) {
                    workShiftRepository.findById(sc.getShiftId()).ifPresent(ws -> shiftsToday.add(ws.getName()));
                }
            }

            DoctorOptionDto opt = new DoctorOptionDto();
            opt.setDoctorId(staff.getId());
            opt.setDoctorName(staff.getFullName());
            opt.setStaffCode(staff.getStaffCode());
            opt.setSpecialty(profile != null ? profile.getSpecialty() : "Bác sĩ khám bệnh");
            opt.setDepartmentId(dept != null ? dept.getId() : null);
            opt.setDepartmentName(dept != null ? dept.getName() : "Đa khoa");
            opt.setShiftsToday(shiftsToday);

            doctorOptions.add(opt);
        }

        return doctorOptions;
    }

    /**
     * UC-LH02: Đặt lịch hẹn
     */
    @Transactional
    public AppointmentResponse bookAppointment(CreateAppointmentRequest req, Long actorUserId) {
        if (req.getAppointmentDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày khám");
        }
        if (req.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Không thể đặt lịch hẹn trong quá khứ");
        }
        if (req.getAppointmentTime() == null) {
            throw new IllegalArgumentException("Vui lòng chọn khung giờ khám");
        }

        // Tìm hoặc tạo hồ sơ bệnh nhân
        Patient patient = resolveOrCreatePatient(req, actorUserId);

        // Kiểm tra bác sĩ & trùng giờ
        Staff doctor = null;
        if (req.getDoctorId() != null) {
            doctor = staffRepository.findById(req.getDoctorId())
                    .orElseThrow(() -> new IllegalArgumentException("Bác sĩ không tồn tại với ID: " + req.getDoctorId()));

            boolean isBooked = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNotIn(
                    doctor.getId(),
                    req.getAppointmentDate(),
                    req.getAppointmentTime(),
                    List.of("CANCELLED")
            );
            if (isBooked) {
                throw new IllegalArgumentException("Bác sĩ " + doctor.getFullName() +
                        " đã có lịch hẹn vào lúc " + req.getAppointmentTime() +
                        " ngày " + req.getAppointmentDate() + ". Vui lòng chọn khung giờ khác.");
            }
        }

        // Chuyên khoa
        Long deptId = req.getDepartmentId();
        if (deptId == null && doctor != null && doctor.getDepartmentId() != null) {
            deptId = doctor.getDepartmentId();
        }

        // Sinh mã lịch hẹn duy nhất: LH-yyyyMMdd-XXXX
        String datePrefix = req.getAppointmentDate().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        String appointmentCode = "LH-" + datePrefix + "-" + randomSuffix;

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode(appointmentCode);
        appointment.setPatientId(patient.getId());
        appointment.setDoctorId(doctor != null ? doctor.getId() : null);
        appointment.setDepartmentId(deptId);
        appointment.setAppointmentDate(req.getAppointmentDate());
        appointment.setAppointmentTime(req.getAppointmentTime());
        appointment.setSymptomsSummary(req.getSymptomsSummary() != null ? req.getSymptomsSummary().trim() : "");
        appointment.setBookingChannel(req.getBookingChannel() != null ? req.getBookingChannel() : "ONLINE_PORTAL");
        appointment.setNotes(req.getNotes());

        // Nếu lễ tân / nhân viên đặt trực tiếp hoặc qua điện thoại -> CONFIRMED, nếu BN đặt trực tuyến -> PENDING
        if ("DIRECT_WALKIN".equalsIgnoreCase(req.getBookingChannel()) || "CALL_CENTER".equalsIgnoreCase(req.getBookingChannel())) {
            appointment.setStatus("CONFIRMED");
            if (actorUserId != null) {
                staffRepository.findByUserId(actorUserId).ifPresent(s -> appointment.setReceptionistId(s.getId()));
            }
        } else {
            appointment.setStatus("PENDING");
        }

        Appointment saved = appointmentRepository.save(appointment);

        // Tự động gửi thông báo xác nhận đặt hẹn (UC-LH06)
        String doctorInfo = doctor != null ? "Bác sĩ " + doctor.getFullName() : "Bác sĩ chuyên khoa";
        String channelDesc = "ONLINE_PORTAL".equalsIgnoreCase(saved.getBookingChannel()) ? "trực tuyến qua Cổng bệnh nhân" : "tại quầy tiếp đón";
        String smsContent = String.format(
                "Kính gửi %s, lịch hẹn khám mã %s vào lúc %s ngày %s cùng %s đã được đặt thành công (%s).",
                patient.getFullName(),
                saved.getAppointmentCode(),
                saved.getAppointmentTime(),
                saved.getAppointmentDate(),
                doctorInfo,
                channelDesc
        );

        createReminderRecord(saved.getId(), "SMS", patient.getPhone(), "Thông báo đặt lịch khám", smsContent);
        if (patient.getEmail() != null && !patient.getEmail().isBlank()) {
            createReminderRecord(saved.getId(), "EMAIL", patient.getEmail(), "Xác nhận lịch hẹn khám " + saved.getAppointmentCode(), smsContent);
        }

        logAudit(actorUserId, "BOOK_APPOINTMENT", "APPOINTMENT", saved.getId(),
                "Đặt lịch hẹn mã: " + saved.getAppointmentCode() + " cho BN: " + patient.getFullName());

        return mapToResponse(saved);
    }

    /**
     * UC-LH03: Xác nhận lịch hẹn (Lễ tân)
     */
    @Transactional
    public AppointmentResponse confirmAppointment(Long appointmentId, ConfirmAppointmentRequest req, Long actorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        if ("CANCELLED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Lịch hẹn đã bị hủy trước đó, không thể xác nhận");
        }

        appointment.setStatus("CONFIRMED");
        if (req != null && req.getNotes() != null && !req.getNotes().isBlank()) {
            String currentNotes = appointment.getNotes() != null ? appointment.getNotes() + "\n" : "";
            appointment.setNotes(currentNotes + "[Lễ tân xác nhận]: " + req.getNotes().trim());
        }

        if (actorUserId != null) {
            staffRepository.findByUserId(actorUserId).ifPresent(s -> appointment.setReceptionistId(s.getId()));
        }

        Appointment saved = appointmentRepository.save(appointment);

        // Gửi thông báo nhắc lịch đã xác nhận (UC-LH06)
        Patient patient = patientRepository.findById(saved.getPatientId()).orElse(null);
        if (patient != null) {
            String content = String.format(
                    "Kính gửi %s, lịch hẹn mã %s khám vào lúc %s ngày %s đã được Lễ tân xác nhận. Quý khách vui lòng đến trước 15 phút để chuẩn bị tiếp đón.",
                    patient.getFullName(),
                    saved.getAppointmentCode(),
                    saved.getAppointmentTime(),
                    saved.getAppointmentDate()
            );
            createReminderRecord(saved.getId(), "SMS", patient.getPhone(), "Lịch hẹn đã được xác nhận", content);
        }

        logAudit(actorUserId, "CONFIRM_APPOINTMENT", "APPOINTMENT", saved.getId(), "Xác nhận lịch hẹn: " + saved.getAppointmentCode());

        return mapToResponse(saved);
    }

    /**
     * UC-LH04: Đổi giờ lịch hẹn (Bệnh nhân, Lễ tân)
     */
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, RescheduleAppointmentRequest req, Long actorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        if ("CANCELLED".equalsIgnoreCase(appointment.getStatus()) || "COMPLETED".equalsIgnoreCase(appointment.getStatus()) || "NO_SHOW".equalsIgnoreCase(appointment.getStatus())) {
            if ("CANCELLED".equalsIgnoreCase(appointment.getStatus()) && appointment.getCancellationReason() != null && appointment.getCancellationReason().contains("No-Show")) {
                throw new IllegalArgumentException("Lịch hẹn đã bị hủy do bệnh nhân vắng mặt (No-Show), không thể đổi giờ");
            }
            throw new IllegalArgumentException("Không thể đổi giờ cho lịch hẹn đã hoàn thành hoặc đã bị hủy");
        }

        if (req.getNewDate() == null || req.getNewTime() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày mới và giờ mới");
        }

        if (req.getNewDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Không thể dời lịch hẹn sang ngày trong quá khứ");
        }

        Long targetDoctorId = req.getNewDoctorId() != null ? req.getNewDoctorId() : appointment.getDoctorId();

        if (targetDoctorId != null) {
            boolean isConflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNotAndStatusNotIn(
                    targetDoctorId,
                    req.getNewDate(),
                    req.getNewTime(),
                    appointment.getId(),
                    List.of("CANCELLED")
            );
            if (isConflict) {
                throw new IllegalArgumentException("Bác sĩ đã có lịch hẹn vào khung giờ mới này. Vui lòng chọn khung giờ khác.");
            }
        }

        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldTime = appointment.getAppointmentTime();

        appointment.setAppointmentDate(req.getNewDate());
        appointment.setAppointmentTime(req.getNewTime());
        if (req.getNewDoctorId() != null) {
            appointment.setDoctorId(req.getNewDoctorId());
        }

        String reasonStr = (req.getReason() != null && !req.getReason().isBlank()) ? req.getReason().trim() : "Yêu cầu thay đổi";
        String logChange = String.format("[Đổi lịch]: Từ %s %s sang %s %s. Lý do: %s",
                oldTime, oldDate, req.getNewTime(), req.getNewDate(), reasonStr);
        String currentNotes = appointment.getNotes() != null ? appointment.getNotes() + "\n" : "";
        appointment.setNotes(currentNotes + logChange);

        Appointment saved = appointmentRepository.save(appointment);

        // Gửi thông báo đổi lịch (UC-LH06)
        Patient patient = patientRepository.findById(saved.getPatientId()).orElse(null);
        if (patient != null) {
            String content = String.format(
                    "Kính gửi %s, lịch hẹn %s của quý khách đã được đổi sang: %s ngày %s. Lý do: %s.",
                    patient.getFullName(),
                    saved.getAppointmentCode(),
                    saved.getAppointmentTime(),
                    saved.getAppointmentDate(),
                    reasonStr
            );
            createReminderRecord(saved.getId(), "SMS", patient.getPhone(), "Thông báo dời lịch hẹn khám", content);
        }

        logAudit(actorUserId, "RESCHEDULE_APPOINTMENT", "APPOINTMENT", saved.getId(), logChange);

        return mapToResponse(saved);
    }

    /**
     * UC-LH05: Hủy lịch hẹn (Bệnh nhân, Lễ tân)
     */
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, CancelAppointmentRequest req, Long actorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        if ("CANCELLED".equalsIgnoreCase(appointment.getStatus())) {
            return mapToResponse(appointment);
        }

        String reason = (req != null && req.getReason() != null && !req.getReason().isBlank())
                ? req.getReason().trim()
                : "Bệnh nhân/Lễ tân yêu cầu hủy lịch";

        appointment.setStatus("CANCELLED");
        appointment.setCancellationReason(reason);

        Appointment saved = appointmentRepository.save(appointment);

        // Gửi thông báo hủy (UC-LH06)
        Patient patient = patientRepository.findById(saved.getPatientId()).orElse(null);
        if (patient != null) {
            String content = String.format(
                    "Kính gửi %s, lịch hẹn %s vào ngày %s đã được hủy thành công. Lý do: %s. Cảm ơn quý khách.",
                    patient.getFullName(),
                    saved.getAppointmentCode(),
                    saved.getAppointmentDate(),
                    reason
            );
            createReminderRecord(saved.getId(), "SMS", patient.getPhone(), "Xác nhận hủy lịch hẹn khám", content);
        }

        logAudit(actorUserId, "CANCEL_APPOINTMENT", "APPOINTMENT", saved.getId(), "Hủy lịch hẹn: " + saved.getAppointmentCode() + ". Lý do: " + reason);

        return mapToResponse(saved);
    }

    /**
     * UC-LH06: Gửi nhắc lịch hẹn (SMS/Email)
     */
    @Transactional
    public AppointmentReminderDto sendReminder(Long appointmentId, SendReminderRequest req, Long actorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
        String recipient = req != null ? req.getRecipient() : null;
        String type = (req != null && req.getReminderType() != null) ? req.getReminderType().toUpperCase() : "SMS";

        if (recipient == null || recipient.isBlank()) {
            if ("EMAIL".equalsIgnoreCase(type)) {
                recipient = patient != null ? patient.getEmail() : "";
            } else {
                recipient = patient != null ? patient.getPhone() : "";
            }
        }

        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException("Không có số điện thoại hoặc email người nhận hợp lệ");
        }

        String title = (req != null && req.getTitle() != null && !req.getTitle().isBlank())
                ? req.getTitle().trim()
                : "Nhắc lịch hẹn khám bệnh";

        String content = (req != null && req.getContent() != null && !req.getContent().isBlank())
                ? req.getContent().trim()
                : String.format(
                        "Kính gửi %s, quý khách có lịch hẹn khám %s vào lúc %s ngày %s. Vui lòng đến đúng giờ.",
                        patient != null ? patient.getFullName() : "Quý khách",
                        appointment.getAppointmentCode(),
                        appointment.getAppointmentTime(),
                        appointment.getAppointmentDate()
                );

        AppointmentReminder reminder = createReminderRecord(appointment.getId(), type, recipient, title, content);

        logAudit(actorUserId, "SEND_REMINDER", "APPOINTMENT_REMINDER", reminder.getId(),
                "Gửi nhắc lịch hẹn " + appointment.getAppointmentCode() + " qua " + type + " tới " + recipient);

        return mapReminderToDto(reminder);
    }

    /**
     * Xem danh sách lịch sử nhắc lịch hẹn của 1 lịch hẹn
     */
    @Transactional(readOnly = true)
    public List<AppointmentReminderDto> getRemindersByAppointmentId(Long appointmentId) {
        return reminderRepository.findByAppointmentIdOrderBySentAtDesc(appointmentId)
                .stream()
                .map(this::mapReminderToDto)
                .collect(Collectors.toList());
    }

    /**
     * UC-LH07: Xem danh sách lịch hẹn trong ngày (Lễ tân, Bác sĩ)
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments(
            LocalDate date,
            Long doctorId,
            Long departmentId,
            String status,
            String keyword,
            Long patientId,
            Long actorUserId
    ) {
        // Nếu actor là bác sĩ và không chỉ định doctorId, tự động lọc theo bác sĩ hiện tại
        if (doctorId == null && actorUserId != null) {
            Optional<Staff> staffOpt = staffRepository.findByUserId(actorUserId);
            if (staffOpt.isPresent() && staffOpt.get().getStaffCode().toUpperCase().startsWith("BS")) {
                doctorId = staffOpt.get().getId();
            }
        }

        List<Appointment> list = appointmentRepository.searchAppointments(date, doctorId, departmentId, status, patientId);

        // Lọc từ khóa tìm kiếm (mã hẹn, tên bệnh nhân, số điện thoại)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lower = keyword.trim().toLowerCase();
            list = list.stream().filter(a -> {
                if (a.getAppointmentCode() != null && a.getAppointmentCode().toLowerCase().contains(lower)) {
                    return true;
                }
                Patient p = patientRepository.findById(a.getPatientId()).orElse(null);
                if (p != null) {
                    return (p.getFullName() != null && p.getFullName().toLowerCase().contains(lower))
                            || (p.getPhone() != null && p.getPhone().contains(lower))
                            || (p.getPatientCode() != null && p.getPatientCode().toLowerCase().contains(lower));
                }
                return false;
            }).collect(Collectors.toList());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Thống kê lịch hẹn theo ngày
     */
    @Transactional(readOnly = true)
    public AppointmentStatsDto getAppointmentStats(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        long total = appointmentRepository.countByAppointmentDate(date);
        long pending = appointmentRepository.countByAppointmentDateAndStatus(date, "PENDING");
        long confirmed = appointmentRepository.countByAppointmentDateAndStatus(date, "CONFIRMED");
        long checkedIn = appointmentRepository.countByAppointmentDateAndStatus(date, "CHECKED_IN");
        long completed = appointmentRepository.countByAppointmentDateAndStatus(date, "COMPLETED");
        long cancelled = appointmentRepository.countByAppointmentDateAndStatus(date, "CANCELLED");
        long noShow = appointmentRepository.countByAppointmentDateAndStatus(date, "NO_SHOW");

        return new AppointmentStatsDto(date, total, pending, confirmed, checkedIn, completed, cancelled, noShow);
    }

    /**
     * Chi tiết lịch hẹn
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + id));
        return mapToResponse(appointment);
    }

    /**
     * UC-LH08: Xử lý bệnh nhân không đến (no-show) (Lễ tân)
     */
    @Transactional
    public AppointmentResponse markNoShow(Long appointmentId, NoShowRequest req, Long actorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        if ("COMPLETED".equalsIgnoreCase(appointment.getStatus()) || "CANCELLED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Lịch hẹn đã hoàn thành hoặc đã bị hủy, không thể đánh dấu vắng mặt");
        }

        String rawReason = (req != null && req.getReason() != null && !req.getReason().isBlank())
                ? req.getReason().trim()
                : "Bệnh nhân không đến theo giờ hẹn (No-Show)";
        String cancellationReason = "[Vắng mặt (No-Show)]: " + rawReason;

        // Yêu cầu: Khi lễ tân xác nhận vắng mặt thì mặc định là đã hủy và không cho phép đổi giờ
        appointment.setStatus("CANCELLED");
        appointment.setCancellationReason(cancellationReason);

        String currentNotes = appointment.getNotes() != null ? appointment.getNotes() + "\n" : "";
        appointment.setNotes(currentNotes + "[Xác nhận vắng mặt]: Lịch hẹn chuyển sang trạng thái Đã hủy. Lý do: " + rawReason);

        Appointment saved = appointmentRepository.save(appointment);

        // Gửi thông báo tới bệnh nhân về việc hủy lịch do vắng mặt
        Patient patient = patientRepository.findById(saved.getPatientId()).orElse(null);
        if (patient != null) {
            String content = String.format(
                    "Kính gửi %s, lịch hẹn khám %s vào lúc %s ngày %s đã bị hủy do ghi nhận vắng mặt (No-Show). Lý do: %s.",
                    patient.getFullName(),
                    saved.getAppointmentCode(),
                    saved.getAppointmentTime(),
                    saved.getAppointmentDate(),
                    rawReason
            );
            createReminderRecord(saved.getId(), "SMS", patient.getPhone(), "Thông báo hủy lịch hẹn do vắng mặt", content);
        }

        logAudit(actorUserId, "MARK_NO_SHOW", "APPOINTMENT", saved.getId(),
                "Xác nhận vắng mặt (No-Show), tự động hủy lịch: " + saved.getAppointmentCode() + ". Lý do: " + rawReason);

        return mapToResponse(saved);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private Patient resolveOrCreatePatient(CreateAppointmentRequest req, Long actorUserId) {
        // 1. Nếu có ID truyền vào
        if (req.getPatientId() != null) {
            return patientRepository.findById(req.getPatientId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân với ID: " + req.getPatientId()));
        }

        // 2. Nếu bệnh nhân tự đăng nhập đặt lịch
        if (actorUserId != null) {
            Optional<Patient> pOpt = patientRepository.findByUserId(actorUserId);
            if (pOpt.isPresent()) {
                return pOpt.get();
            }
        }

        // 3. Nếu có số điện thoại, tìm theo số điện thoại
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String cleanPhone = req.getPhone().trim();
            Optional<Patient> existing = patientRepository.findByPhone(cleanPhone);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        // 4. Nếu chưa có hồ sơ, tự động tạo hồ sơ bệnh nhân mới
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập họ và tên bệnh nhân");
        }
        if (req.getPhone() == null || req.getPhone().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập số điện thoại liên hệ");
        }

        Patient newPatient = new Patient();
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        newPatient.setPatientCode("BN" + datePrefix + randomSuffix);
        newPatient.setFullName(req.getFullName().trim());
        newPatient.setPhone(req.getPhone().trim());
        newPatient.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        newPatient.setDateOfBirth(req.getDateOfBirth() != null ? req.getDateOfBirth() : LocalDate.of(1990, 1, 1));
        newPatient.setGender(req.getGender() != null ? req.getGender() : "MALE");
        newPatient.setIsActive(true);

        return patientRepository.save(newPatient);
    }

    private AppointmentReminder createReminderRecord(Long appointmentId, String reminderType, String recipient, String title, String content) {
        AppointmentReminder reminder = new AppointmentReminder();
        reminder.setAppointmentId(appointmentId);
        reminder.setReminderType(reminderType);
        reminder.setRecipient(recipient != null ? recipient : "");
        reminder.setTitle(title);
        reminder.setContent(content);
        reminder.setStatus("SENT");
        reminder.setSentAt(LocalDateTime.now());
        return reminderRepository.save(reminder);
    }

    private AppointmentResponse mapToResponse(Appointment a) {
        AppointmentResponse res = new AppointmentResponse();
        res.setId(a.getId());
        res.setAppointmentCode(a.getAppointmentCode());
        res.setPatientId(a.getPatientId());
        res.setDoctorId(a.getDoctorId());
        res.setDepartmentId(a.getDepartmentId());
        res.setReceptionistId(a.getReceptionistId());
        res.setAppointmentDate(a.getAppointmentDate());
        res.setAppointmentTime(a.getAppointmentTime());
        res.setSymptomsSummary(a.getSymptomsSummary());
        res.setBookingChannel(a.getBookingChannel());
        res.setStatus(a.getStatus());
        res.setNotes(a.getNotes());
        res.setCancellationReason(a.getCancellationReason());
        res.setCreatedAt(a.getCreatedAt());
        res.setUpdatedAt(a.getUpdatedAt());

        // Lấy thông tin bệnh nhân
        if (a.getPatientId() != null) {
            patientRepository.findById(a.getPatientId()).ifPresent(p -> {
                res.setPatientCode(p.getPatientCode());
                res.setPatientName(p.getFullName());
                res.setPatientPhone(p.getPhone());
                res.setPatientEmail(p.getEmail());
                res.setPatientGender(p.getGender());
                res.setPatientDob(p.getDateOfBirth());
            });
        }

        // Lấy thông tin bác sĩ
        if (a.getDoctorId() != null) {
            staffRepository.findById(a.getDoctorId()).ifPresent(d -> {
                res.setDoctorName(d.getFullName());
                res.setDoctorCode(d.getStaffCode());
                doctorProfileRepository.findByStaffId(d.getId()).ifPresent(dp -> res.setDoctorSpecialty(dp.getSpecialty()));
            });
        }

        // Lấy thông tin chuyên khoa
        if (a.getDepartmentId() != null) {
            departmentRepository.findById(a.getDepartmentId()).ifPresent(dept -> res.setDepartmentName(dept.getName()));
        }

        // Lấy thông tin lễ tân
        if (a.getReceptionistId() != null) {
            staffRepository.findById(a.getReceptionistId()).ifPresent(rec -> res.setReceptionistName(rec.getFullName()));
        }

        // Lấy lịch sử nhắc hẹn
        List<AppointmentReminderDto> reminders = reminderRepository.findByAppointmentIdOrderBySentAtDesc(a.getId())
                .stream()
                .map(this::mapReminderToDto)
                .collect(Collectors.toList());
        res.setReminders(reminders);

        return res;
    }

    private AppointmentReminderDto mapReminderToDto(AppointmentReminder r) {
        AppointmentReminderDto dto = new AppointmentReminderDto();
        dto.setId(r.getId());
        dto.setAppointmentId(r.getAppointmentId());
        dto.setReminderType(r.getReminderType());
        dto.setRecipient(r.getRecipient());
        dto.setTitle(r.getTitle());
        dto.setContent(r.getContent());
        dto.setStatus(r.getStatus());
        dto.setSentAt(r.getSentAt());
        return dto;
    }

    private void logAudit(Long userId, String action, String entityName, Long entityId, String detail) {
        try {
            String safeDetail = detail != null ? detail.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ") : "";
            String json = "{\"detail\":\"" + safeDetail + "\"}";
            AuditLog log = new AuditLog(userId, action, entityName, entityId != null ? String.valueOf(entityId) : null, json, "127.0.0.1");
            auditLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }
}
