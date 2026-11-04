package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.AppointmentDtos.*;
import com.clinic.clinic_management.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final com.clinic.clinic_management.repository.PatientRepository patientRepository;

    @Autowired
    public AppointmentController(AppointmentService appointmentService,
                                 com.clinic.clinic_management.repository.PatientRepository patientRepository) {
        this.appointmentService = appointmentService;
        this.patientRepository = patientRepository;
    }

    /**
     * UC-LH01: Xem khung giờ trống của bác sĩ
     */
    @GetMapping("/slots")
    public ResponseEntity<?> getDoctorSlots(
            @RequestParam Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        try {
            DoctorSlotSummaryDto summary = appointmentService.getDoctorAvailableSlots(doctorId, date);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Danh sách bác sĩ có thể đặt lịch theo ngày và chuyên khoa
     */
    @GetMapping("/doctors")
    public ResponseEntity<?> getAvailableDoctors(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long departmentId
    ) {
        try {
            List<DoctorOptionDto> list = appointmentService.getAvailableDoctors(date, departmentId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH02: Đặt lịch hẹn (Bệnh nhân, Lễ tân)
     */
    @PostMapping
    public ResponseEntity<?> bookAppointment(
            @RequestBody CreateAppointmentRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentResponse res = appointmentService.bookAppointment(req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH03: Xác nhận lịch hẹn (Lễ tân)
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmAppointmentRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentResponse res = appointmentService.confirmAppointment(id, req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH04: Đổi giờ lịch hẹn (Bệnh nhân, Lễ tân)
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long id,
            @RequestBody RescheduleAppointmentRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentResponse res = appointmentService.rescheduleAppointment(id, req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH05: Hủy lịch hẹn (Bệnh nhân, Lễ tân)
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) CancelAppointmentRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentResponse res = appointmentService.cancelAppointment(id, req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH06: Gửi nhắc lịch hẹn (SMS/email) (Lễ tân, Hệ thống)
     */
    @PostMapping("/{id}/reminders")
    public ResponseEntity<?> sendReminder(
            @PathVariable Long id,
            @RequestBody(required = false) SendReminderRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentReminderDto res = appointmentService.sendReminder(id, req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Xem danh sách các lần nhắc lịch của lịch hẹn
     */
    @GetMapping("/{id}/reminders")
    public ResponseEntity<?> getAppointmentReminders(@PathVariable Long id) {
        try {
            List<AppointmentReminderDto> list = appointmentService.getRemindersByAppointmentId(id);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Lấy danh sách lịch hẹn của bệnh nhân theo patientId hoặc userId
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getAppointmentsByPatientPath(@PathVariable Long patientId) {
        try {
            Long effectivePatientId = patientId;
            java.util.Optional<com.clinic.clinic_management.entity.Patient> pOpt = patientRepository.findByUserId(patientId);
            if (pOpt.isPresent()) {
                effectivePatientId = pOpt.get().getId();
            }
            List<AppointmentResponse> list = appointmentService.getAppointments(
                    null, null, null, null, null, effectivePatientId, null
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH07: Xem danh sách lịch hẹn trong ngày (Lễ tân, Bác sĩ)
     */
    @GetMapping
    public ResponseEntity<?> getAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long userId
    ) {
        try {
            List<AppointmentResponse> list = appointmentService.getAppointments(
                    date, doctorId, departmentId, status, keyword, patientId, userId
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Thống kê lịch hẹn theo ngày
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getAppointmentStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        try {
            AppointmentStatsDto stats = appointmentService.getAppointmentStats(date);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Lấy chi tiết lịch hẹn theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            AppointmentResponse res = appointmentService.getAppointmentById(id);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * UC-LH08: Xử lý bệnh nhân không đến (no-show) (Lễ tân)
     */
    @PutMapping("/{id}/no-show")
    public ResponseEntity<?> markNoShow(
            @PathVariable Long id,
            @RequestBody(required = false) NoShowRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            AppointmentResponse res = appointmentService.markNoShow(id, req, userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
