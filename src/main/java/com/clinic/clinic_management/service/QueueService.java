package com.clinic.clinic_management.service;

import com.clinic.clinic_management.dto.QueueDtos.*;
import com.clinic.clinic_management.entity.*;
import com.clinic.clinic_management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private final QueueTicketRepository queueTicketRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ClinicRoomRepository clinicRoomRepository;
    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final AuditLogRepository auditLogRepository;

    public QueueService(
            QueueTicketRepository queueTicketRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            ClinicRoomRepository clinicRoomRepository,
            StaffRepository staffRepository,
            DepartmentRepository departmentRepository,
            StaffScheduleRepository staffScheduleRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.queueTicketRepository = queueTicketRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.clinicRoomRepository = clinicRoomRepository;
        this.staffRepository = staffRepository;
        this.departmentRepository = departmentRepository;
        this.staffScheduleRepository = staffScheduleRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * UC-TD01: Check-in bệnh nhân có lịch hẹn (Lễ tân)
     */
    @Transactional
    public QueueTicketResponse checkInAppointment(CheckInAppointmentRequest req, Long actorUserId) {
        if (req == null || (req.getAppointmentId() == null && (req.getAppointmentCode() == null || req.getAppointmentCode().isBlank()))) {
            throw new IllegalArgumentException("Vui lòng cung cấp mã hoặc ID lịch hẹn cần check-in");
        }

        Appointment appointment;
        if (req.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(req.getAppointmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + req.getAppointmentId()));
        } else {
            appointment = appointmentRepository.findByAppointmentCode(req.getAppointmentCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với mã: " + req.getAppointmentCode()));
        }

        if ("CANCELLED".equalsIgnoreCase(appointment.getStatus()) || "NO_SHOW".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Lịch hẹn này đã bị hủy hoặc ghi nhận vắng mặt, không thể check-in");
        }
        if ("COMPLETED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Lịch hẹn này đã hoàn tất khám bệnh trước đó");
        }

        // Kiểm tra xem đã cấp vé check-in trong ngày chưa
        Optional<QueueTicket> existingTicket = queueTicketRepository.findByAppointmentId(appointment.getId());
        if (existingTicket.isPresent()) {
            QueueTicket t = existingTicket.get();
            if (t.getQueueDate().equals(LocalDate.now()) && !"SKIPPED".equalsIgnoreCase(t.getStatus())) {
                return mapToResponse(t);
            }
        }

        // Xác định phòng khám tiếp nhận
        ClinicRoom room = resolveRoomForAppointment(appointment, req.getRoomId());
        if (room == null) {
            throw new IllegalArgumentException("Không tìm thấy phòng khám phù hợp còn hoạt động để tiếp nhận bệnh nhân");
        }

        // Cập nhật trạng thái lịch hẹn sang CHECKED_IN
        appointment.setStatus("CHECKED_IN");
        String currentNotes = appointment.getNotes() != null ? appointment.getNotes() + "\n" : "";
        appointment.setNotes(currentNotes + "[Check-in]: Tiếp đón lúc " + LocalDateTime.now().toLocalTime() + " tại phòng " + room.getRoomNumber());
        if (actorUserId != null) {
            staffRepository.findByUserId(actorUserId).ifPresent(s -> appointment.setReceptionistId(s.getId()));
        }
        appointmentRepository.save(appointment);

        // Bệnh nhân có lịch hẹn ưu tiên xếp trước (hoặc theo mức gửi lên)
        String priority = (req.getPriority() != null && !req.getPriority().isBlank())
                ? req.getPriority().toUpperCase()
                : "PRIORITY";

        // Cấp số thứ tự (UC-TD03)
        QueueTicket ticket = issueNewTicket(
                appointment.getPatientId(),
                appointment.getId(),
                room.getId(),
                appointment.getDoctorId(),
                priority,
                true,
                appointment.getSymptomsSummary() != null ? appointment.getSymptomsSummary() : "Khám theo lịch hẹn",
                req.getNotes(),
                actorUserId
        );

        logAudit(actorUserId, "CHECK_IN_APPOINTMENT", "QUEUE_TICKET", ticket.getId(),
                "Check-in lịch hẹn " + appointment.getAppointmentCode() + " cấp STT " + ticket.getTicketCode() + " phòng " + room.getRoomNumber());

        return mapToResponse(ticket);
    }

    /**
     * UC-TD02: Tiếp nhận bệnh nhân vãng lai (Lễ tân)
     */
    @Transactional
    public QueueTicketResponse receptionWalkIn(WalkInReceptionRequest req, Long actorUserId) {
        if (req == null) {
            throw new IllegalArgumentException("Dữ liệu tiếp nhận vãng lai không hợp lệ");
        }

        // 1. Tìm hoặc tạo hồ sơ bệnh nhân
        Patient patient = resolveOrCreatePatient(req);

        // 2. Xác định phòng khám
        ClinicRoom room = resolveRoomForWalkIn(req);
        if (room == null) {
            throw new IllegalArgumentException("Không tìm thấy phòng khám phù hợp còn hoạt động để tiếp nhận");
        }

        // 3. Xác định bác sĩ phụ trách (nếu có chỉ định hoặc lấy theo lịch trực của phòng)
        Long doctorId = req.getDoctorId();
        if (doctorId == null) {
            doctorId = findDoctorOnDutyForRoom(room.getId(), LocalDate.now());
        }

        String priority = (req.getPriority() != null && !req.getPriority().isBlank())
                ? req.getPriority().toUpperCase()
                : "NORMAL";

        String serviceType = (req.getServiceType() != null && !req.getServiceType().isBlank())
                ? req.getServiceType().trim()
                : "Khám bệnh vãng lai";

        // 4. Cấp số thứ tự (UC-TD03)
        QueueTicket ticket = issueNewTicket(
                patient.getId(),
                null,
                room.getId(),
                doctorId,
                priority,
                false,
                serviceType,
                req.getNotes(),
                actorUserId
        );

        logAudit(actorUserId, "RECEPTION_WALK_IN", "QUEUE_TICKET", ticket.getId(),
                "Tiếp nhận bệnh nhân vãng lai: " + patient.getFullName() + ", cấp STT " + ticket.getTicketCode() + " phòng " + room.getRoomNumber());

        return mapToResponse(ticket);
    }

    /**
     * UC-TD03: Cấp số thứ tự (Hệ thống & Lễ tân dùng chung)
     */
    @Transactional
    public QueueTicket issueNewTicket(
            Long patientId,
            Long appointmentId,
            Long roomId,
            Long doctorId,
            String priority,
            Boolean isAppointment,
            String serviceType,
            String notes,
            Long actorUserId
    ) {
        LocalDate today = LocalDate.now();

        // Tính số thứ tự kế tiếp trong ngày của phòng khám này
        int nextNumber = queueTicketRepository.findMaxTicketNumberByRoomAndDate(roomId, today) + 1;

        ClinicRoom room = clinicRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng khám không tồn tại với ID: " + roomId));

        // Sinh mã phiếu: ví dụ P101-001 hoặc STT-P101-001
        String ticketCode = String.format("%s-%03d", room.getRoomNumber(), nextNumber);

        QueueTicket ticket = new QueueTicket();
        ticket.setTicketCode(ticketCode);
        ticket.setPatientId(patientId);
        ticket.setAppointmentId(appointmentId);
        ticket.setRoomId(roomId);
        ticket.setDoctorId(doctorId);
        ticket.setTicketNumber(nextNumber);
        ticket.setPriority(priority != null ? priority : "NORMAL");
        ticket.setAppointment(Boolean.TRUE.equals(isAppointment));
        ticket.setServiceType(serviceType);
        ticket.setQueueDate(today);
        ticket.setStatus("WAITING");
        ticket.setCallCount(0);
        ticket.setNotes(notes);

        return queueTicketRepository.save(ticket);
    }

    /**
     * UC-TD04: Xem hàng chờ theo phòng khám (Lễ tân, Bác sĩ, Điều dưỡng)
     */
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getQueueByRoom(Long roomId, LocalDate date, String status) {
        if (date == null) {
            date = LocalDate.now();
        }
        List<QueueTicket> list = queueTicketRepository.findQueueByRoomAndDateWithPriority(roomId, date, status);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * UC-TD04: Xem tổng quan hàng chờ của tất cả các phòng khám trong ngày
     */
    @Transactional(readOnly = true)
    public List<RoomQueueOverviewDto> getRoomQueueOverview(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<ClinicRoom> rooms = clinicRoomRepository.findAll();
        List<RoomQueueOverviewDto> overviewList = new ArrayList<>();

        for (ClinicRoom room : rooms) {
            // Chỉ lấy các phòng khám bệnh (EXAMINATION) hoặc phòng chức năng có bệnh nhân chờ
            if (!"EXAMINATION".equalsIgnoreCase(room.getRoomType()) && !"EMERGENCY".equalsIgnoreCase(room.getRoomType())) {
                continue;
            }

            RoomQueueOverviewDto dto = new RoomQueueOverviewDto();
            dto.setRoomId(room.getId());
            dto.setRoomNumber(room.getRoomNumber());
            dto.setRoomName(room.getName());
            dto.setAvailable(room.getIsAvailable());

            if (room.getDepartmentId() != null) {
                dto.setDepartmentId(room.getDepartmentId());
                departmentRepository.findById(room.getDepartmentId()).ifPresent(d -> dto.setDepartmentName(d.getName()));
            }

            // Bác sĩ trực phòng hôm nay
            Long docId = findDoctorOnDutyForRoom(room.getId(), date);
            if (docId != null) {
                dto.setDoctorId(docId);
                staffRepository.findById(docId).ifPresent(s -> dto.setDoctorName(s.getFullName()));
            }

            // Đếm các trạng thái
            long waiting = queueTicketRepository.countByRoomIdAndQueueDateAndStatus(room.getId(), date, "WAITING");
            long completed = queueTicketRepository.countByRoomIdAndQueueDateAndStatus(room.getId(), date, "COMPLETED");
            long total = queueTicketRepository.countByRoomIdAndQueueDate(room.getId(), date);

            dto.setWaitingCount(waiting);
            dto.setCompletedCount(completed);
            dto.setTotalCount(total);

            // Bệnh nhân đang được gọi hoặc đang phục vụ
            List<QueueTicket> activeTickets = queueTicketRepository.findByRoomIdAndQueueDateAndStatusInOrderByTicketNumberAsc(
                    room.getId(), date, List.of("SERVING", "CALLED")
            );
            for (QueueTicket at : activeTickets) {
                if ("SERVING".equalsIgnoreCase(at.getStatus()) && dto.getCurrentServing() == null) {
                    dto.setCurrentServing(mapToResponse(at));
                } else if ("CALLED".equalsIgnoreCase(at.getStatus()) && dto.getCurrentCalled() == null) {
                    dto.setCurrentCalled(mapToResponse(at));
                }
            }

            overviewList.add(dto);
        }

        return overviewList;
    }

    /**
     * Thống kê tổng hợp số lượng lượt khám trong ngày
     */
    @Transactional(readOnly = true)
    public QueueStatsDto getQueueStats(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        long total = queueTicketRepository.countByQueueDate(date);
        long waiting = queueTicketRepository.countByQueueDateAndStatus(date, "WAITING");
        long called = queueTicketRepository.countByQueueDateAndStatus(date, "CALLED");
        long serving = queueTicketRepository.countByQueueDateAndStatus(date, "SERVING");
        long completed = queueTicketRepository.countByQueueDateAndStatus(date, "COMPLETED");
        long skipped = queueTicketRepository.countByQueueDateAndStatus(date, "SKIPPED");

        return new QueueStatsDto(date, total, waiting, called, serving, completed, skipped);
    }

    /**
     * UC-TD05: Gọi bệnh nhân vào khám (Bác sĩ, Điều dưỡng)
     */
    @Transactional
    public QueueTicketResponse callNextPatient(Long roomId, Long ticketId, Long actorUserId) {
        LocalDate today = LocalDate.now();

        QueueTicket ticketToCall = null;

        if (ticketId != null) {
            ticketToCall = queueTicketRepository.findById(ticketId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu thứ tự với ID: " + ticketId));
        } else if (roomId != null) {
            // Lấy bệnh nhân tiếp theo đang chờ theo độ ưu tiên
            List<QueueTicket> waitingList = queueTicketRepository.findQueueByRoomAndDateWithPriority(roomId, today, "WAITING");
            if (waitingList.isEmpty()) {
                throw new IllegalArgumentException("Hiện không còn bệnh nhân nào đang chờ tại phòng này");
            }
            ticketToCall = waitingList.get(0);
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp mã phòng khám hoặc mã phiếu cần gọi");
        }

        // Chuyển các phiếu CALLED trước đó của phòng về WAITING nếu chưa vào SERVING
        List<QueueTicket> currentlyCalled = queueTicketRepository.findByRoomIdAndQueueDateAndStatusInOrderByTicketNumberAsc(
                ticketToCall.getRoomId(), today, List.of("CALLED")
        );
        for (QueueTicket c : currentlyCalled) {
            if (!c.getId().equals(ticketToCall.getId())) {
                // Giữ nguyên trạng thái hoặc chuyển sang chờ
            }
        }

        final QueueTicket finalTicket = ticketToCall;
        finalTicket.setStatus("CALLED");
        finalTicket.setCalledAt(LocalDateTime.now());
        finalTicket.setCallCount(finalTicket.getCallCount() != null ? finalTicket.getCallCount() + 1 : 1);

        // Gán bác sĩ nếu actor là bác sĩ
        if (actorUserId != null && finalTicket.getDoctorId() == null) {
            staffRepository.findByUserId(actorUserId).ifPresent(s -> {
                if (s.getStaffCode().toUpperCase().startsWith("BS")) {
                    finalTicket.setDoctorId(s.getId());
                }
            });
        }

        QueueTicket saved = queueTicketRepository.save(finalTicket);

        logAudit(actorUserId, "CALL_PATIENT", "QUEUE_TICKET", saved.getId(),
                "Gọi bệnh nhân STT " + saved.getTicketCode() + " vào phòng khám (Lần gọi thứ " + saved.getCallCount() + ")");

        return mapToResponse(saved);
    }

    /**
     * Bác sĩ bấm bắt đầu khám (SERVING)
     */
    @Transactional
    public QueueTicketResponse startServing(Long ticketId, Long actorUserId) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu với ID: " + ticketId));

        ticket.setStatus("SERVING");
        ticket.setServingAt(LocalDateTime.now());

        if (actorUserId != null) {
            staffRepository.findByUserId(actorUserId).ifPresent(s -> {
                if (s.getStaffCode().toUpperCase().startsWith("BS")) {
                    ticket.setDoctorId(s.getId());
                }
            });
        }

        QueueTicket saved = queueTicketRepository.save(ticket);
        logAudit(actorUserId, "START_SERVING", "QUEUE_TICKET", saved.getId(), "Bắt đầu khám bệnh nhân STT: " + saved.getTicketCode());
        return mapToResponse(saved);
    }

    /**
     * Bác sĩ / Điều dưỡng bỏ qua lượt khám (SKIPPED)
     */
    @Transactional
    public QueueTicketResponse skipPatient(Long ticketId, SkipTicketRequest req, Long actorUserId) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu với ID: " + ticketId));

        ticket.setStatus("SKIPPED");
        String reason = (req != null && req.getReason() != null && !req.getReason().isBlank())
                ? req.getReason().trim()
                : "Bệnh nhân không có mặt sau nhiều lần gọi";
        String currentNotes = ticket.getNotes() != null ? ticket.getNotes() + "\n" : "";
        ticket.setNotes(currentNotes + "[Bỏ qua]: " + reason);

        QueueTicket saved = queueTicketRepository.save(ticket);
        logAudit(actorUserId, "SKIP_PATIENT", "QUEUE_TICKET", saved.getId(), "Bỏ qua lượt khám STT: " + saved.getTicketCode() + ". Lý do: " + reason);
        return mapToResponse(saved);
    }

    /**
     * Hoàn thành phiên khám (COMPLETED)
     */
    @Transactional
    public QueueTicketResponse completeServing(Long ticketId, Long actorUserId) {
        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu với ID: " + ticketId));

        ticket.setStatus("COMPLETED");
        ticket.setCompletedAt(LocalDateTime.now());

        // Cập nhật cuộc hẹn tương ứng nếu có
        if (ticket.getAppointmentId() != null) {
            appointmentRepository.findById(ticket.getAppointmentId()).ifPresent(app -> {
                app.setStatus("COMPLETED");
                appointmentRepository.save(app);
            });
        }

        QueueTicket saved = queueTicketRepository.save(ticket);
        logAudit(actorUserId, "COMPLETE_SERVING", "QUEUE_TICKET", saved.getId(), "Hoàn thành khám bệnh nhân STT: " + saved.getTicketCode());
        return mapToResponse(saved);
    }

    /**
     * UC-TD06: Chuyển bệnh nhân sang phòng/bác sĩ khác (Lễ tân)
     */
    @Transactional
    public QueueTicketResponse transferPatient(Long ticketId, TransferRoomRequest req, Long actorUserId) {
        if (req == null || req.getTargetRoomId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn phòng khám đích cần chuyển tới");
        }

        QueueTicket ticket = queueTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu thứ tự với ID: " + ticketId));

        if ("COMPLETED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Bệnh nhân đã hoàn thành khám, không thể chuyển phòng");
        }

        ClinicRoom targetRoom = clinicRoomRepository.findById(req.getTargetRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Phòng khám đích không tồn tại với ID: " + req.getTargetRoomId()));

        if (Boolean.FALSE.equals(targetRoom.getIsAvailable())) {
            throw new IllegalArgumentException("Phòng khám đích hiện đang tạm ngưng hoạt động");
        }

        ClinicRoom oldRoom = clinicRoomRepository.findById(ticket.getRoomId()).orElse(null);
        String oldRoomNumber = oldRoom != null ? oldRoom.getRoomNumber() : "phòng cũ";

        // Cấp lại số thứ tự mới tại phòng khám đích
        int newTicketNumber = queueTicketRepository.findMaxTicketNumberByRoomAndDate(targetRoom.getId(), ticket.getQueueDate()) + 1;
        String newTicketCode = String.format("%s-%03d", targetRoom.getRoomNumber(), newTicketNumber);

        // Lưu vết thông tin chuyển phòng
        ticket.setTransferredFromRoomId(ticket.getRoomId());
        ticket.setRoomId(targetRoom.getId());
        ticket.setTicketNumber(newTicketNumber);
        ticket.setTicketCode(newTicketCode);
        if (req.getTargetDoctorId() != null) {
            ticket.setDoctorId(req.getTargetDoctorId());
        } else {
            ticket.setDoctorId(findDoctorOnDutyForRoom(targetRoom.getId(), ticket.getQueueDate()));
        }

        String reason = (req.getReason() != null && !req.getReason().isBlank()) ? req.getReason().trim() : "Điều phối phòng khám";
        ticket.setTransferReason(reason);
        ticket.setStatus("WAITING"); // Đặt lại trạng thái chờ ở phòng mới
        ticket.setCallCount(0);
        ticket.setCalledAt(null);
        ticket.setServingAt(null);

        String currentNotes = ticket.getNotes() != null ? ticket.getNotes() + "\n" : "";
        ticket.setNotes(currentNotes + String.format("[Chuyển phòng]: Từ %s sang %s. STT mới: %s. Lý do: %s",
                oldRoomNumber, targetRoom.getRoomNumber(), newTicketCode, reason));

        QueueTicket saved = queueTicketRepository.save(ticket);

        logAudit(actorUserId, "TRANSFER_PATIENT", "QUEUE_TICKET", saved.getId(),
                "Chuyển bệnh nhân từ " + oldRoomNumber + " sang " + targetRoom.getRoomNumber() + ", cấp STT mới " + newTicketCode + ". Lý do: " + reason);

        return mapToResponse(saved);
    }

    /**
     * Danh sách bảng điện tử hiển thị công cộng theo ngày (Public Display Screen)
     */
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getPublicDisplayTickets(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return queueTicketRepository.findByQueueDateOrderByRoomIdAscTicketNumberAsc(date)
                .stream()
                .filter(t -> "CALLED".equalsIgnoreCase(t.getStatus()) || "SERVING".equalsIgnoreCase(t.getStatus()) || "WAITING".equalsIgnoreCase(t.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private ClinicRoom resolveRoomForAppointment(Appointment appointment, Long requestedRoomId) {
        if (requestedRoomId != null) {
            return clinicRoomRepository.findById(requestedRoomId).orElse(null);
        }

        // 1. Nếu có bác sĩ, tìm phòng bác sĩ trực hôm nay
        if (appointment.getDoctorId() != null) {
            List<StaffSchedule> schedules = staffScheduleRepository.findByStaffIdAndWorkDate(appointment.getDoctorId(), appointment.getAppointmentDate());
            for (StaffSchedule sc : schedules) {
                if (sc.getRoomId() != null && !"CANCELLED".equalsIgnoreCase(sc.getStatus())) {
                    return clinicRoomRepository.findById(sc.getRoomId()).orElse(null);
                }
            }
        }

        // 2. Tìm phòng khám theo chuyên khoa
        if (appointment.getDepartmentId() != null) {
            List<ClinicRoom> rooms = clinicRoomRepository.findByDepartmentId(appointment.getDepartmentId());
            for (ClinicRoom r : rooms) {
                if (Boolean.TRUE.equals(r.getIsAvailable()) && "EXAMINATION".equalsIgnoreCase(r.getRoomType())) {
                    return r;
                }
            }
        }

        // 3. Fallback lấy phòng khám đầu tiên còn mở
        return clinicRoomRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsAvailable()) && "EXAMINATION".equalsIgnoreCase(r.getRoomType()))
                .findFirst()
                .orElse(null);
    }

    private ClinicRoom resolveRoomForWalkIn(WalkInReceptionRequest req) {
        if (req.getRoomId() != null) {
            return clinicRoomRepository.findById(req.getRoomId()).orElse(null);
        }

        if (req.getDepartmentId() != null) {
            List<ClinicRoom> rooms = clinicRoomRepository.findByDepartmentId(req.getDepartmentId());
            for (ClinicRoom r : rooms) {
                if (Boolean.TRUE.equals(r.getIsAvailable()) && "EXAMINATION".equalsIgnoreCase(r.getRoomType())) {
                    return r;
                }
            }
        }

        return clinicRoomRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsAvailable()) && "EXAMINATION".equalsIgnoreCase(r.getRoomType()))
                .findFirst()
                .orElse(null);
    }

    private Long findDoctorOnDutyForRoom(Long roomId, LocalDate date) {
        List<StaffSchedule> schedules = staffScheduleRepository.findAll();
        for (StaffSchedule sc : schedules) {
            if (roomId.equals(sc.getRoomId()) && date.equals(sc.getWorkDate()) && !"CANCELLED".equalsIgnoreCase(sc.getStatus())) {
                return sc.getStaffId();
            }
        }
        return null;
    }

    private Patient resolveOrCreatePatient(WalkInReceptionRequest req) {
        if (req.getPatientId() != null) {
            return patientRepository.findById(req.getPatientId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân với ID: " + req.getPatientId()));
        }

        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            Optional<Patient> existing = patientRepository.findByPhone(req.getPhone().trim());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        if (req.getIdentityCard() != null && !req.getIdentityCard().isBlank()) {
            Optional<Patient> existing = patientRepository.findByIdentityCard(req.getIdentityCard().trim());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập họ và tên bệnh nhân");
        }
        if (req.getPhone() == null || req.getPhone().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập số điện thoại bệnh nhân");
        }

        Patient newPatient = new Patient();
        long randomSuffix = (long) (Math.random() * 900000 + 100000);
        newPatient.setPatientCode("BN" + LocalDate.now().getYear() + randomSuffix);
        newPatient.setFullName(req.getFullName().trim());
        newPatient.setPhone(req.getPhone().trim());
        newPatient.setDateOfBirth(req.getDateOfBirth() != null ? req.getDateOfBirth() : LocalDate.of(1990, 1, 1));
        newPatient.setGender(req.getGender() != null ? req.getGender() : "OTHER");
        newPatient.setIdentityCard(req.getIdentityCard());
        newPatient.setHealthInsuranceNumber(req.getHealthInsuranceNumber());
        newPatient.setAddress(req.getAddress());
        newPatient.setIsActive(true);

        return patientRepository.save(newPatient);
    }

    private QueueTicketResponse mapToResponse(QueueTicket t) {
        QueueTicketResponse res = new QueueTicketResponse();
        res.setId(t.getId());
        res.setTicketCode(t.getTicketCode());
        res.setTicketNumber(t.getTicketNumber());
        res.setPatientId(t.getPatientId());
        res.setAppointmentId(t.getAppointmentId());
        res.setAppointment(t.getAppointment());
        res.setRoomId(t.getRoomId());
        res.setDoctorId(t.getDoctorId());
        res.setPriority(t.getPriority());
        res.setServiceType(t.getServiceType());
        res.setQueueDate(t.getQueueDate());
        res.setStatus(t.getStatus());
        res.setCalledAt(t.getCalledAt());
        res.setServingAt(t.getServingAt());
        res.setCompletedAt(t.getCompletedAt());
        res.setTransferReason(t.getTransferReason());
        res.setTransferredFromRoomId(t.getTransferredFromRoomId());
        res.setCallCount(t.getCallCount());
        res.setNotes(t.getNotes());
        res.setCreatedAt(t.getCreatedAt());

        patientRepository.findById(t.getPatientId()).ifPresent(p -> {
            res.setPatientCode(p.getPatientCode());
            res.setPatientName(p.getFullName());
            res.setPatientPhone(p.getPhone());
            res.setPatientGender(p.getGender());
            res.setPatientDob(p.getDateOfBirth());
            res.setIdentityCard(p.getIdentityCard());
            if (p.getDateOfBirth() != null) {
                res.setPatientAge(Period.between(p.getDateOfBirth(), LocalDate.now()).getYears());
            }
        });

        if (t.getAppointmentId() != null) {
            appointmentRepository.findById(t.getAppointmentId()).ifPresent(a -> res.setAppointmentCode(a.getAppointmentCode()));
        }

        clinicRoomRepository.findById(t.getRoomId()).ifPresent(r -> {
            res.setRoomNumber(r.getRoomNumber());
            res.setRoomName(r.getName());
            res.setDepartmentId(r.getDepartmentId());
            if (r.getDepartmentId() != null) {
                departmentRepository.findById(r.getDepartmentId()).ifPresent(d -> res.setDepartmentName(d.getName()));
            }
        });

        if (t.getTransferredFromRoomId() != null) {
            clinicRoomRepository.findById(t.getTransferredFromRoomId()).ifPresent(r -> res.setTransferredFromRoomName(r.getRoomNumber() + " - " + r.getName()));
        }

        if (t.getDoctorId() != null) {
            staffRepository.findById(t.getDoctorId()).ifPresent(s -> {
                res.setDoctorName(s.getFullName());
                res.setDoctorStaffCode(s.getStaffCode());
            });
        }

        // Tính vị trí chờ (số người đang chờ phía trước có cùng roomId và status = WAITING có STT nhỏ hơn)
        if ("WAITING".equalsIgnoreCase(t.getStatus())) {
            List<QueueTicket> queue = queueTicketRepository.findByRoomIdAndQueueDateAndStatusInOrderByTicketNumberAsc(
                    t.getRoomId(), t.getQueueDate(), List.of("WAITING")
            );
            int pos = 0;
            for (QueueTicket q : queue) {
                if (q.getId().equals(t.getId())) {
                    break;
                }
                pos++;
            }
            res.setWaitPosition(pos);
        } else {
            res.setWaitPosition(0);
        }

        return res;
    }

    private void logAudit(Long userId, String action, String entityName, Long entityId, String detail) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId != null ? String.valueOf(entityId) : null);
        log.setNewData("{\"detail\":\"" + detail.replace("\"", "\\\"") + "\"}");
        log.setCreatedAt(LocalDateTime.now());
        log.setIpAddress("127.0.0.1");
        auditLogRepository.save(log);
    }
}
