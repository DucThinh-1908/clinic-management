package com.clinic.clinic_management.controller;

import com.clinic.clinic_management.dto.StaffSchedulingDtos.*;
import com.clinic.clinic_management.service.StaffSchedulingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StaffSchedulingController {

    @Autowired
    private StaffSchedulingService staffSchedulingService;

    // Helper to get client IP
    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // =========================================================================
    // UC-NS01 & UC-NS02: Nhân sự (Staff)
    // =========================================================================
    @GetMapping("/staff")
    public ResponseEntity<?> getAllStaff(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId) {
        try {
            List<StaffResponse> list = staffSchedulingService.getAllStaff(search, status, departmentId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<?> getStaffById(@PathVariable Long id) {
        try {
            StaffResponse res = staffSchedulingService.getStaffById(id);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/staff/me")
    public ResponseEntity<?> getMyStaffProfile(@RequestParam Long userId) {
        return staffSchedulingService.getStaffByUserId(userId)
                .map(s -> ResponseEntity.ok(staffSchedulingService.getStaffById(s.getId())))
                .orElse(ResponseEntity.ok(null));
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(
            @RequestBody StaffCreateRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            StaffResponse res = staffSchedulingService.createStaff(req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm mới hồ sơ nhân sự thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<?> updateStaff(
            @PathVariable Long id,
            @RequestBody StaffUpdateRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            StaffResponse res = staffSchedulingService.updateStaff(id, req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật hồ sơ nhân sự thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/staff/{id}/status")
    public ResponseEntity<?> changeStaffStatus(
            @PathVariable Long id,
            @RequestBody StaffStatusRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            StaffResponse res = staffSchedulingService.changeStaffStatus(id, req, actorUserId, getClientIp(request));
            String msg = "RESIGNED".equalsIgnoreCase(req.status) ? "Đã ghi nhận thôi việc nhân sự thành công." : "Cập nhật trạng thái nhân viên thành công.";
            return ResponseEntity.ok(Map.of("success", true, "message", msg, "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // UC-NS03: Quản lý chuyên khoa và phòng khám
    // =========================================================================
    @GetMapping("/departments")
    public ResponseEntity<?> getAllDepartments() {
        return ResponseEntity.ok(staffSchedulingService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(
            @RequestBody DepartmentRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            DepartmentResponse res = staffSchedulingService.createDepartment(req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm chuyên khoa / phòng ban thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(
            @PathVariable Long id,
            @RequestBody DepartmentRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            DepartmentResponse res = staffSchedulingService.updateDepartment(id, req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thông tin chuyên khoa thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/departments/{id}/toggle")
    public ResponseEntity<?> toggleDepartment(
            @PathVariable Long id,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            DepartmentResponse res = staffSchedulingService.toggleDepartmentStatus(id, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Thay đổi trạng thái chuyên khoa thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Phòng khám (Clinic rooms)
    @GetMapping("/rooms")
    public ResponseEntity<?> getAllRooms(@RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(staffSchedulingService.getAllRooms(departmentId));
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(
            @RequestBody ClinicRoomRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            ClinicRoomResponse res = staffSchedulingService.createRoom(req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm phòng khám mới thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<?> updateRoom(
            @PathVariable Long id,
            @RequestBody ClinicRoomRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            ClinicRoomResponse res = staffSchedulingService.updateRoom(id, req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật phòng khám thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/rooms/{id}/toggle")
    public ResponseEntity<?> toggleRoom(
            @PathVariable Long id,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            ClinicRoomResponse res = staffSchedulingService.toggleRoomAvailability(id, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái sẵn sàng của phòng khám thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // UC-NS04 & UC-NS05: Lịch làm việc & Ca làm việc
    // =========================================================================
    @GetMapping("/shifts")
    public ResponseEntity<?> getAllShifts() {
        return ResponseEntity.ok(staffSchedulingService.getAllShifts());
    }

    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false) Long roomId) {
        try {
            List<ScheduleResponse> list = staffSchedulingService.getSchedules(startDate, endDate, departmentId, staffId, roomId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(
            @RequestBody ScheduleCreateRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            ScheduleResponse res = staffSchedulingService.createSchedule(req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Phân lịch làm việc thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/schedules/batch")
    public ResponseEntity<?> batchCreateSchedules(
            @RequestBody ScheduleBatchCreateRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            List<ScheduleResponse> list = staffSchedulingService.batchCreateSchedules(req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã phân lịch hàng loạt thành công (" + list.size() + " ca trực).", "data", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long id,
            @RequestBody ScheduleCreateRequest req,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            ScheduleResponse res = staffSchedulingService.updateSchedule(id, req, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật lịch làm việc thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<?> deleteSchedule(
            @PathVariable Long id,
            @RequestParam(required = false) Long actorUserId,
            HttpServletRequest request) {
        try {
            staffSchedulingService.deleteSchedule(id, actorUserId, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Hủy lịch làm việc thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // UC-NS06: Đăng ký nghỉ / đổi ca
    // =========================================================================
    @PostMapping("/leave-swap")
    public ResponseEntity<?> createLeaveSwapRequest(
            @RequestBody LeaveSwapCreateRequest req,
            @RequestParam Long actorUserId,
            HttpServletRequest request) {
        try {
            LeaveSwapResponse res = staffSchedulingService.createLeaveSwapRequest(req, actorUserId, getClientIp(request));
            String typeName = "LEAVE".equalsIgnoreCase(req.requestType) ? "xin nghỉ phép" : "đổi ca trực";
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi yêu cầu " + typeName + " đến Quản lý xét duyệt.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/leave-swap")
    public ResponseEntity<?> getLeaveSwapRequests(
            @RequestParam Long actorUserId,
            @RequestParam(required = false) String status) {
        try {
            List<LeaveSwapResponse> list = staffSchedulingService.getLeaveSwapRequests(actorUserId, status);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/leave-swap/{id}/review")
    public ResponseEntity<?> reviewLeaveSwapRequest(
            @PathVariable Long id,
            @RequestBody LeaveSwapReviewRequest req,
            @RequestParam Long actorUserId,
            HttpServletRequest request) {
        try {
            LeaveSwapResponse res = staffSchedulingService.reviewLeaveSwapRequest(id, req, actorUserId, getClientIp(request));
            String act = "APPROVED".equalsIgnoreCase(req.status) ? "Phê duyệt" : "Từ chối";
            return ResponseEntity.ok(Map.of("success", true, "message", act + " yêu cầu thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // UC-NS07: Chấm công (Attendance)
    // =========================================================================
    @PostMapping("/attendance/check-in")
    public ResponseEntity<?> checkIn(
            @RequestBody(required = false) AttendanceCheckInRequest req,
            @RequestParam Long actorUserId,
            HttpServletRequest request) {
        try {
            AttendanceResponse res = staffSchedulingService.checkIn(actorUserId, req, getClientIp(request));
            String statusText = "ON_TIME".equalsIgnoreCase(res.status) ? "đúng giờ" : "vào ca trễ";
            return ResponseEntity.ok(Map.of("success", true, "message", "Điểm danh Check-in thành công (" + statusText + ").", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/attendance/check-out")
    public ResponseEntity<?> checkOut(
            @RequestBody(required = false) AttendanceCheckOutRequest req,
            @RequestParam Long actorUserId,
            HttpServletRequest request) {
        try {
            AttendanceResponse res = staffSchedulingService.checkOut(actorUserId, req, getClientIp(request));
            return ResponseEntity.ok(Map.of("success", true, "message", "Điểm danh Check-out kết thúc ca thành công.", "data", res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/attendance/my")
    public ResponseEntity<?> getMyAttendance(
            @RequestParam Long actorUserId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<AttendanceResponse> list = staffSchedulingService.getMyAttendance(actorUserId, startDate, endDate);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/attendance/all")
    public ResponseEntity<?> getAllAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long staffId) {
        try {
            List<AttendanceResponse> list = staffSchedulingService.getAllAttendances(startDate, endDate, departmentId, staffId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
