package com.clinic.clinic_management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class StaffSchedulingDtos {

    // -------------------------------------------------------------
    // UC-NS01 & UC-NS02: Nhân sự
    // -------------------------------------------------------------
    public static class StaffCreateRequest {
        public Long userId;
        public String username;
        public String password;
        public String email;
        public String phone;
        public String roleCode;

        public String staffCode;
        public String fullName;
        public String gender;
        public LocalDate dateOfBirth;
        public String idCardNumber;
        public String address;
        public String qualification;
        public LocalDate hireDate;
        public Long departmentId;
        public String status = "ACTIVE";

        // Bác sĩ (nếu có)
        public String licenseNumber;
        public String specialty;
        public BigDecimal consultationFee;
        public String biography;
        public Integer yearsOfExperience;
    }

    public static class StaffUpdateRequest {
        public String fullName;
        public String gender;
        public LocalDate dateOfBirth;
        public String idCardNumber;
        public String address;
        public String qualification;
        public LocalDate hireDate;
        public Long departmentId;
        public String status;
        public String phone;
        public String email;

        // Bác sĩ
        public String licenseNumber;
        public String specialty;
        public BigDecimal consultationFee;
        public String biography;
        public Integer yearsOfExperience;
    }

    public static class StaffStatusRequest {
        public String status; // ACTIVE, ON_LEAVE, RESIGNED
        public String reason;
    }

    public static class StaffResponse {
        public Long id;
        public Long userId;
        public String username;
        public String email;
        public String phone;
        public String roleCode;
        public String roleName;

        public String staffCode;
        public String fullName;
        public String gender;
        public LocalDate dateOfBirth;
        public String idCardNumber;
        public String address;
        public String qualification;
        public LocalDate hireDate;
        public String status;
        public Long departmentId;
        public String departmentName;

        // Bác sĩ
        public String licenseNumber;
        public String specialty;
        public BigDecimal consultationFee;
        public String biography;
        public Integer yearsOfExperience;

        public LocalDateTime createdAt;
    }

    // -------------------------------------------------------------
    // UC-NS03: Chuyên khoa & Phòng khám
    // -------------------------------------------------------------
    public static class DepartmentRequest {
        public String code;
        public String name;
        public String description;
        public String location;
        public Boolean isActive = true;
    }

    public static class DepartmentResponse {
        public Long id;
        public String code;
        public String name;
        public String description;
        public String location;
        public Boolean isActive;
        public int roomCount;
        public int staffCount;
        public LocalDateTime createdAt;
    }

    public static class ClinicRoomRequest {
        public Long departmentId;
        public String roomNumber;
        public String name;
        public String roomType;
        public Boolean isAvailable = true;
    }

    public static class ClinicRoomResponse {
        public Long id;
        public Long departmentId;
        public String departmentName;
        public String roomNumber;
        public String name;
        public String roomType;
        public Boolean isAvailable;
    }

    // -------------------------------------------------------------
    // UC-NS04 & UC-NS05: Lịch làm việc
    // -------------------------------------------------------------
    public static class WorkShiftResponse {
        public Long id;
        public String name;
        public LocalTime startTime;
        public LocalTime endTime;
    }

    public static class ScheduleCreateRequest {
        public Long staffId;
        public Long shiftId;
        public Long roomId;
        public LocalDate workDate;
        public String note;
    }

    public static class ScheduleBatchCreateRequest {
        public List<ScheduleCreateRequest> schedules;
    }

    public static class ScheduleResponse {
        public Long id;
        public Long staffId;
        public String staffCode;
        public String staffName;
        public String staffRole;
        public String qualification;
        public Long departmentId;
        public String departmentName;

        public Long shiftId;
        public String shiftName;
        public LocalTime shiftStartTime;
        public LocalTime shiftEndTime;

        public Long roomId;
        public String roomNumber;
        public String roomName;

        public LocalDate workDate;
        public String note;
        public String status; // SCHEDULED, ATTENDED, ABSENT, CANCELLED
        public LocalDateTime createdAt;
    }

    // -------------------------------------------------------------
    // UC-NS06: Đăng ký nghỉ / đổi ca
    // -------------------------------------------------------------
    public static class LeaveSwapCreateRequest {
        public String requestType; // LEAVE, SWAP
        public Long scheduleId;
        public LocalDate leaveDate;
        public Long targetStaffId;
        public LocalDate targetDate;
        public Long targetShiftId;
        public String reason;
    }

    public static class LeaveSwapReviewRequest {
        public String status; // APPROVED, REJECTED
        public String reviewNote;
    }

    public static class LeaveSwapResponse {
        public Long id;
        public Long staffId;
        public String staffName;
        public String staffCode;
        public String requestType;

        public Long scheduleId;
        public LocalDate currentWorkDate;
        public String currentShiftName;
        public String currentRoomName;

        public LocalDate leaveDate;
        public Long targetStaffId;
        public String targetStaffName;
        public LocalDate targetDate;
        public Long targetShiftId;
        public String targetShiftName;

        public String reason;
        public String status; // PENDING, APPROVED, REJECTED

        public Long reviewerId;
        public String reviewerName;
        public String reviewNote;
        public LocalDateTime reviewedAt;
        public LocalDateTime createdAt;
    }

    // -------------------------------------------------------------
    // UC-NS07: Chấm công
    // -------------------------------------------------------------
    public static class AttendanceCheckInRequest {
        public String notes;
    }

    public static class AttendanceCheckOutRequest {
        public String notes;
    }

    public static class AttendanceResponse {
        public Long id;
        public Long staffId;
        public String staffCode;
        public String staffName;
        public String departmentName;

        public Long scheduleId;
        public String shiftName;
        public LocalTime expectedStartTime;
        public LocalTime expectedEndTime;

        public LocalDate attendanceDate;
        public LocalDateTime checkInTime;
        public LocalDateTime checkOutTime;
        public String status; // ON_TIME, LATE, EARLY_LEAVE, LATE_AND_EARLY_LEAVE, ABSENT
        public String notes;
    }
}
