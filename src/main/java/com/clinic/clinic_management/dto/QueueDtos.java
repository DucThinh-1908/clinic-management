package com.clinic.clinic_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class QueueDtos {

    // UC-TD01: Check-in bệnh nhân có lịch hẹn
    public static class CheckInAppointmentRequest {
        private Long appointmentId;
        private String appointmentCode;
        private Long roomId;
        private String priority = "NORMAL"; // NORMAL, PRIORITY, EMERGENCY
        private String notes;

        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        public String getAppointmentCode() { return appointmentCode; }
        public void setAppointmentCode(String appointmentCode) { this.appointmentCode = appointmentCode; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // UC-TD02: Tiếp nhận bệnh nhân vãng lai
    public static class WalkInReceptionRequest {
        private Long patientId;
        private String fullName;
        private String phone;
        private LocalDate dateOfBirth;
        private String gender; // MALE, FEMALE, OTHER
        private String identityCard;
        private String healthInsuranceNumber;
        private String address;

        private Long departmentId;
        private Long roomId;
        private Long doctorId;
        private String serviceType;
        private String priority = "NORMAL";
        private String notes;

        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public LocalDate getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public String getIdentityCard() { return identityCard; }
        public void setIdentityCard(String identityCard) { this.identityCard = identityCard; }
        public String getHealthInsuranceNumber() { return healthInsuranceNumber; }
        public void setHealthInsuranceNumber(String healthInsuranceNumber) { this.healthInsuranceNumber = healthInsuranceNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // UC-TD06: Chuyển bệnh nhân sang phòng/bác sĩ khác
    public static class TransferRoomRequest {
        private Long targetRoomId;
        private Long targetDoctorId;
        private String reason;

        public Long getTargetRoomId() { return targetRoomId; }
        public void setTargetRoomId(Long targetRoomId) { this.targetRoomId = targetRoomId; }
        public Long getTargetDoctorId() { return targetDoctorId; }
        public void setTargetDoctorId(Long targetDoctorId) { this.targetDoctorId = targetDoctorId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // Yêu cầu bỏ qua lượt khám
    public static class SkipTicketRequest {
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // Response chi tiết phiếu số thứ tự tiếp đón (Queue Ticket)
    public static class QueueTicketResponse {
        private Long id;
        private String ticketCode;
        private Integer ticketNumber;
        private Long patientId;
        private String patientCode;
        private String patientName;
        private String patientPhone;
        private String patientGender;
        private LocalDate patientDob;
        private Integer patientAge;
        private String identityCard;

        private Long appointmentId;
        private String appointmentCode;
        private Boolean isAppointment;

        private Long roomId;
        private String roomNumber;
        private String roomName;
        private Long departmentId;
        private String departmentName;

        private Long doctorId;
        private String doctorName;
        private String doctorStaffCode;

        private String priority;
        private String serviceType;
        private LocalDate queueDate;
        private String status;

        private LocalDateTime calledAt;
        private LocalDateTime servingAt;
        private LocalDateTime completedAt;
        private String transferReason;
        private Long transferredFromRoomId;
        private String transferredFromRoomName;
        private Integer callCount;
        private String notes;
        private LocalDateTime createdAt;
        private Integer waitPosition; // Số người chờ phía trước

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTicketCode() { return ticketCode; }
        public void setTicketCode(String ticketCode) { this.ticketCode = ticketCode; }
        public Integer getTicketNumber() { return ticketNumber; }
        public void setTicketNumber(Integer ticketNumber) { this.ticketNumber = ticketNumber; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public String getPatientCode() { return patientCode; }
        public void setPatientCode(String patientCode) { this.patientCode = patientCode; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientPhone() { return patientPhone; }
        public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
        public String getPatientGender() { return patientGender; }
        public void setPatientGender(String patientGender) { this.patientGender = patientGender; }
        public LocalDate getPatientDob() { return patientDob; }
        public void setPatientDob(LocalDate patientDob) { this.patientDob = patientDob; }
        public Integer getPatientAge() { return patientAge; }
        public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }
        public String getIdentityCard() { return identityCard; }
        public void setIdentityCard(String identityCard) { this.identityCard = identityCard; }
        public Long getAppointmentId() { return appointmentId; }
        public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
        public String getAppointmentCode() { return appointmentCode; }
        public void setAppointmentCode(String appointmentCode) { this.appointmentCode = appointmentCode; }
        public Boolean getAppointment() { return isAppointment; }
        public void setAppointment(Boolean appointment) { isAppointment = appointment; }
        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getRoomNumber() { return roomNumber; }
        public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDoctorStaffCode() { return doctorStaffCode; }
        public void setDoctorStaffCode(String doctorStaffCode) { this.doctorStaffCode = doctorStaffCode; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public LocalDate getQueueDate() { return queueDate; }
        public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCalledAt() { return calledAt; }
        public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }
        public LocalDateTime getServingAt() { return servingAt; }
        public void setServingAt(LocalDateTime servingAt) { this.servingAt = servingAt; }
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
        public String getTransferReason() { return transferReason; }
        public void setTransferReason(String transferReason) { this.transferReason = transferReason; }
        public Long getTransferredFromRoomId() { return transferredFromRoomId; }
        public void setTransferredFromRoomId(Long transferredFromRoomId) { this.transferredFromRoomId = transferredFromRoomId; }
        public String getTransferredFromRoomName() { return transferredFromRoomName; }
        public void setTransferredFromRoomName(String transferredFromRoomName) { this.transferredFromRoomName = transferredFromRoomName; }
        public Integer getCallCount() { return callCount; }
        public void setCallCount(Integer callCount) { this.callCount = callCount; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public Integer getWaitPosition() { return waitPosition; }
        public void setWaitPosition(Integer waitPosition) { this.waitPosition = waitPosition; }
    }

    // UC-TD04: Tổng quan hàng chờ theo từng phòng khám
    public static class RoomQueueOverviewDto {
        private Long roomId;
        private String roomNumber;
        private String roomName;
        private Long departmentId;
        private String departmentName;
        private Long doctorId;
        private String doctorName;
        private Boolean isAvailable;

        private QueueTicketResponse currentServing;
        private QueueTicketResponse currentCalled;
        private long waitingCount;
        private long completedCount;
        private long totalCount;

        public Long getRoomId() { return roomId; }
        public void setRoomId(Long roomId) { this.roomId = roomId; }
        public String getRoomNumber() { return roomNumber; }
        public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public Boolean getAvailable() { return isAvailable; }
        public void setAvailable(Boolean available) { isAvailable = available; }
        public QueueTicketResponse getCurrentServing() { return currentServing; }
        public void setCurrentServing(QueueTicketResponse currentServing) { this.currentServing = currentServing; }
        public QueueTicketResponse getCurrentCalled() { return currentCalled; }
        public void setCurrentCalled(QueueTicketResponse currentCalled) { this.currentCalled = currentCalled; }
        public long getWaitingCount() { return waitingCount; }
        public void setWaitingCount(long waitingCount) { this.waitingCount = waitingCount; }
        public long getCompletedCount() { return completedCount; }
        public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }
        public long getTotalCount() { return totalCount; }
        public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    }

    // Thống kê tổng hợp ngày
    public static class QueueStatsDto {
        private LocalDate date;
        private long totalTickets;
        private long waiting;
        private long called;
        private long serving;
        private long completed;
        private long skipped;

        public QueueStatsDto() {}

        public QueueStatsDto(LocalDate date, long totalTickets, long waiting, long called, long serving, long completed, long skipped) {
            this.date = date;
            this.totalTickets = totalTickets;
            this.waiting = waiting;
            this.called = called;
            this.serving = serving;
            this.completed = completed;
            this.skipped = skipped;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public long getTotalTickets() { return totalTickets; }
        public void setTotalTickets(long totalTickets) { this.totalTickets = totalTickets; }
        public long getWaiting() { return waiting; }
        public void setWaiting(long waiting) { this.waiting = waiting; }
        public long getCalled() { return called; }
        public void setCalled(long called) { this.called = called; }
        public long getServing() { return serving; }
        public void setServing(long serving) { this.serving = serving; }
        public long getCompleted() { return completed; }
        public void setCompleted(long completed) { this.completed = completed; }
        public long getSkipped() { return skipped; }
        public void setSkipped(long skipped) { this.skipped = skipped; }
    }
}
