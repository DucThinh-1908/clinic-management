package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.QueueDtos.*;
import com.clinic.clinic_management.service.QueueService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
@CrossOrigin(origins = "*")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    /**
     * UC-TD01: Check-in bệnh nhân có lịch hẹn (Lễ tân)
     */
    @PostMapping("/check-in")
    public ResponseEntity<?> checkInAppointment(
            @RequestBody CheckInAppointmentRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            QueueTicketResponse res = queueService.checkInAppointment(req, userId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi máy chủ khi check-in lịch hẹn: " + e.getMessage()));
        }
    }

    /**
     * UC-TD02 & UC-TD03: Tiếp nhận bệnh nhân vãng lai & Cấp số thứ tự (Lễ tân)
     */
    @PostMapping("/walk-in")
    public ResponseEntity<?> receptionWalkIn(
            @RequestBody WalkInReceptionRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            QueueTicketResponse res = queueService.receptionWalkIn(req, userId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi máy chủ khi tiếp nhận bệnh nhân vãng lai: " + e.getMessage()));
        }
    }

    /**
     * UC-TD04: Xem hàng chờ theo phòng khám (Lễ tân, Bác sĩ, Điều dưỡng)
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<QueueTicketResponse>> getQueueByRoom(
            @PathVariable Long roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(queueService.getQueueByRoom(roomId, date, status));
    }

    /**
     * UC-TD04: Xem tổng quan hàng chờ tất cả các phòng khám trong ngày (Lễ tân, Quản lý)
     */
    @GetMapping("/overview")
    public ResponseEntity<List<RoomQueueOverviewDto>> getRoomQueueOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(queueService.getRoomQueueOverview(date));
    }

    /**
     * Thống kê tổng hợp lượt tiếp đón & hàng chờ trong ngày
     */
    @GetMapping("/stats")
    public ResponseEntity<QueueStatsDto> getQueueStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(queueService.getQueueStats(date));
    }

    /**
     * Màn hình tivi hiển thị gọi số công cộng tại sảnh tiếp đón (Public Queue Display Screen)
     */
    @GetMapping("/public-board")
    public ResponseEntity<List<QueueTicketResponse>> getPublicDisplayTickets(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(queueService.getPublicDisplayTickets(date));
    }

    /**
     * UC-TD05: Gọi bệnh nhân vào khám theo mã phiếu (Bác sĩ, Điều dưỡng)
     */
    @RequestMapping(value = {"/{ticketId}/call", "/call/{ticketId}"}, method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> callPatientByTicketId(
            @PathVariable Long ticketId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long doctorId
    ) {
        try {
            Long staffUserId = userId != null ? userId : doctorId;
            QueueTicketResponse res = queueService.callNextPatient(null, ticketId, staffUserId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi máy chủ khi gọi bệnh nhân: " + e.getMessage()));
        }
    }

    /**
     * UC-TD05: Gọi bệnh nhân tiếp theo trong hàng chờ của phòng khám (Bác sĩ, Điều dưỡng)
     */
    @RequestMapping(value = {"/room/{roomId}/call-next", "/call-next/{roomId}"}, method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> callNextPatientInRoom(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long doctorId
    ) {
        try {
            Long staffUserId = userId != null ? userId : doctorId;
            QueueTicketResponse res = queueService.callNextPatient(roomId, null, staffUserId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi máy chủ khi gọi bệnh nhân kế tiếp: " + e.getMessage()));
        }
    }

    /**
     * Bác sĩ bắt đầu vào khám (SERVING)
     */
    @RequestMapping(value = {"/{ticketId}/start", "/serve/{ticketId}"}, method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> startServing(
            @PathVariable Long ticketId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long doctorId
    ) {
        try {
            Long staffUserId = userId != null ? userId : doctorId;
            QueueTicketResponse res = queueService.startServing(ticketId, staffUserId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi bắt đầu khám: " + e.getMessage()));
        }
    }

    /**
     * Bỏ qua lượt khám khi bệnh nhân không có mặt (SKIPPED)
     */
    @PutMapping("/{ticketId}/skip")
    public ResponseEntity<?> skipPatient(
            @PathVariable Long ticketId,
            @RequestBody(required = false) SkipTicketRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            QueueTicketResponse res = queueService.skipPatient(ticketId, req, userId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi bỏ qua lượt khám: " + e.getMessage()));
        }
    }

    /**
     * Hoàn thành phiên khám bệnh (COMPLETED)
     */
    @PutMapping("/{ticketId}/complete")
    public ResponseEntity<?> completeServing(
            @PathVariable Long ticketId,
            @RequestParam(required = false) Long userId
    ) {
        try {
            QueueTicketResponse res = queueService.completeServing(ticketId, userId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi khi hoàn thành phiên khám: " + e.getMessage()));
        }
    }

    /**
     * UC-TD06: Chuyển bệnh nhân sang phòng/bác sĩ khác (Lễ tân)
     */
    @PutMapping("/{ticketId}/transfer")
    public ResponseEntity<?> transferPatient(
            @PathVariable Long ticketId,
            @RequestBody TransferRoomRequest req,
            @RequestParam(required = false) Long userId
    ) {
        try {
            QueueTicketResponse res = queueService.transferPatient(ticketId, req, userId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi máy chủ khi chuyển phòng khám: " + e.getMessage()));
        }
    }
}
