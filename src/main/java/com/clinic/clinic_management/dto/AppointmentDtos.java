package com.clinic.clinic_management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AppointmentDtos {

    public static class DoctorSlotDto {
        private LocalTime startTime;
        private LocalTime endTime;

        @JsonProperty("isAvailable")
        private boolean isAvailable;
        private String shiftName;
        private Long doctorId;
        private String doctorName;
        private String departmentName;
        private String roomName;

        public DoctorSlotDto() {}

        public DoctorSlotDto(LocalTime startTime, LocalTime endTime, boolean isAvailable,
                             String shiftName, Long doctorId, String doctorName,
                             String departmentName, String roomName) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.isAvailable = isAvailable;
            this.shiftName = shiftName;
            this.doctorId = doctorId;
            this.doctorName = doctorName;
            this.departmentName = departmentName;
            this.roomName = roomName;
        }

        public LocalTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalTime startTime) {
            this.startTime = startTime;
        }

        public LocalTime getEndTime() {
            return endTime;
        }

        public void setEndTime(LocalTime endTime) {
            this.endTime = endTime;
        }

        @JsonProperty("isAvailable")
        public boolean isAvailable() {
            return isAvailable;
        }

        @JsonProperty("isAvailable")
        public void setAvailable(boolean available) {
            isAvailable = available;
        }

        public String getShiftName() {
            return shiftName;
        }

        public void setShiftName(String shiftName) {
            this.shiftName = shiftName;
        }

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }

        public String getDoctorName() {
            return doctorName;
        }

        public void setDoctorName(String doctorName) {
            this.doctorName = doctorName;
        }

        public String getDepartmentName() {
            return departmentName;
        }

        public void setDepartmentName(String departmentName) {
            this.departmentName = departmentName;
        }

        public String getRoomName() {
            return roomName;
        }

        public void setRoomName(String roomName) {
            this.roomName = roomName;
        }
    }

    public static class DoctorSlotSummaryDto {
        private Long doctorId;
        private String doctorName;
        private String staffCode;
        private String specialty;
        private Long departmentId;
        private String departmentName;
        private LocalDate workDate;
        private String roomName;
        private BigDecimal consultationFee;
        private List<DoctorSlotDto> slots;

        public DoctorSlotSummaryDto() {}

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }

        public String getDoctorName() {
            return doctorName;
        }

        public void setDoctorName(String doctorName) {
            this.doctorName = doctorName;
        }

        public String getStaffCode() {
            return staffCode;
        }

        public void setStaffCode(String staffCode) {
            this.staffCode = staffCode;
        }

        public String getSpecialty() {
            return specialty;
        }

        public void setSpecialty(String specialty) {
            this.specialty = specialty;
        }

        public Long getDepartmentId() {
            return departmentId;
        }

        public void setDepartmentId(Long departmentId) {
            this.departmentId = departmentId;
        }

        public String getDepartmentName() {
            return departmentName;
        }

        public void setDepartmentName(String departmentName) {
            this.departmentName = departmentName;
        }

        public LocalDate getWorkDate() {
            return workDate;
        }

        public void setWorkDate(LocalDate workDate) {
            this.workDate = workDate;
        }

        public String getRoomName() {
            return roomName;
        }

        public void setRoomName(String roomName) {
            this.roomName = roomName;
        }

        public BigDecimal getConsultationFee() {
            return consultationFee;
        }

        public void setConsultationFee(BigDecimal consultationFee) {
            this.consultationFee = consultationFee;
        }

        public List<DoctorSlotDto> getSlots() {
            return slots;
        }

        public void setSlots(List<DoctorSlotDto> slots) {
            this.slots = slots;
        }
    }

    public static class DoctorOptionDto {
        private Long doctorId;
        private String doctorName;
        private String staffCode;
        private String specialty;
        private Long departmentId;
        private String departmentName;
        private List<String> shiftsToday;

        public DoctorOptionDto() {}

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }

        public String getDoctorName() {
            return doctorName;
        }

        public void setDoctorName(String doctorName) {
            this.doctorName = doctorName;
        }

        public String getStaffCode() {
            return staffCode;
        }

        public void setStaffCode(String staffCode) {
            this.staffCode = staffCode;
        }

        public String getSpecialty() {
            return specialty;
        }

        public void setSpecialty(String specialty) {
            this.specialty = specialty;
        }

        public Long getDepartmentId() {
            return departmentId;
        }

        public void setDepartmentId(Long departmentId) {
            this.departmentId = departmentId;
        }

        public String getDepartmentName() {
            return departmentName;
        }

        public void setDepartmentName(String departmentName) {
            this.departmentName = departmentName;
        }

        public List<String> getShiftsToday() {
            return shiftsToday;
        }

        public void setShiftsToday(List<String> shiftsToday) {
            this.shiftsToday = shiftsToday;
        }
    }

    public static class CreateAppointmentRequest {
        private Long patientId;
        private String fullName;
        private String phone;
        private String email;
        private LocalDate dateOfBirth;
        private String gender;
        private Long doctorId;
        private Long departmentId;
        private LocalDate appointmentDate;
        private LocalTime appointmentTime;
        private String symptomsSummary;
        private String bookingChannel; // ONLINE_PORTAL, CALL_CENTER, DIRECT_WALKIN
        private String notes;

        public CreateAppointmentRequest() {}

        public Long getPatientId() {
            return patientId;
        }

        public void setPatientId(Long patientId) {
            this.patientId = patientId;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public LocalDate getDateOfBirth() {
            return dateOfBirth;
        }

        public void setDateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }

        public Long getDepartmentId() {
            return departmentId;
        }

        public void setDepartmentId(Long departmentId) {
            this.departmentId = departmentId;
        }

        public LocalDate getAppointmentDate() {
            return appointmentDate;
        }

        public void setAppointmentDate(LocalDate appointmentDate) {
            this.appointmentDate = appointmentDate;
        }

        public LocalTime getAppointmentTime() {
            return appointmentTime;
        }

        public void setAppointmentTime(LocalTime appointmentTime) {
            this.appointmentTime = appointmentTime;
        }

        public String getSymptomsSummary() {
            return symptomsSummary;
        }

        public void setSymptomsSummary(String symptomsSummary) {
            this.symptomsSummary = symptomsSummary;
        }

        public String getBookingChannel() {
            return bookingChannel;
        }

        public void setBookingChannel(String bookingChannel) {
            this.bookingChannel = bookingChannel;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class RescheduleAppointmentRequest {
        private LocalDate newDate;
        private LocalTime newTime;
        private Long newDoctorId;
        private String reason;

        public RescheduleAppointmentRequest() {}

        public LocalDate getNewDate() {
            return newDate;
        }

        public void setNewDate(LocalDate newDate) {
            this.newDate = newDate;
        }

        public LocalTime getNewTime() {
            return newTime;
        }

        public void setNewTime(LocalTime newTime) {
            this.newTime = newTime;
        }

        public Long getNewDoctorId() {
            return newDoctorId;
        }

        public void setNewDoctorId(Long newDoctorId) {
            this.newDoctorId = newDoctorId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class CancelAppointmentRequest {
        private String reason;

        public CancelAppointmentRequest() {}

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class ConfirmAppointmentRequest {
        private String notes;

        public ConfirmAppointmentRequest() {}

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class NoShowRequest {
        private String reason;

        public NoShowRequest() {}

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class SendReminderRequest {
        private String reminderType; // SMS, EMAIL
        private String recipient;
        private String title;
        private String content;

        public SendReminderRequest() {}

        public String getReminderType() {
            return reminderType;
        }

        public void setReminderType(String reminderType) {
            this.reminderType = reminderType;
        }

        public String getRecipient() {
            return recipient;
        }

        public void setRecipient(String recipient) {
            this.recipient = recipient;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class AppointmentReminderDto {
        private Long id;
        private Long appointmentId;
        private String reminderType;
        private String recipient;
        private String title;
        private String content;
        private String status;
        private LocalDateTime sentAt;

        public AppointmentReminderDto() {}

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(Long appointmentId) {
            this.appointmentId = appointmentId;
        }

        public String getReminderType() {
            return reminderType;
        }

        public void setReminderType(String reminderType) {
            this.reminderType = reminderType;
        }

        public String getRecipient() {
            return recipient;
        }

        public void setRecipient(String recipient) {
            this.recipient = recipient;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getSentAt() {
            return sentAt;
        }

        public void setSentAt(LocalDateTime sentAt) {
            this.sentAt = sentAt;
        }
    }

    public static class AppointmentResponse {
        private Long id;
        private String appointmentCode;
        private Long patientId;
        private String patientCode;
        private String patientName;
        private String patientPhone;
        private String patientEmail;
        private String patientGender;
        private LocalDate patientDob;
        private Long doctorId;
        private String doctorName;
        private String doctorCode;
        private String doctorSpecialty;
        private Long departmentId;
        private String departmentName;
        private Long receptionistId;
        private String receptionistName;
        private LocalDate appointmentDate;
        private LocalTime appointmentTime;
        private String symptomsSummary;
        private String bookingChannel;
        private String status;
        private String notes;
        private String cancellationReason;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<AppointmentReminderDto> reminders;

        public AppointmentResponse() {}

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getAppointmentCode() {
            return appointmentCode;
        }

        public void setAppointmentCode(String appointmentCode) {
            this.appointmentCode = appointmentCode;
        }

        public Long getPatientId() {
            return patientId;
        }

        public void setPatientId(Long patientId) {
            this.patientId = patientId;
        }

        public String getPatientCode() {
            return patientCode;
        }

        public void setPatientCode(String patientCode) {
            this.patientCode = patientCode;
        }

        public String getPatientName() {
            return patientName;
        }

        public void setPatientName(String patientName) {
            this.patientName = patientName;
        }

        public String getPatientPhone() {
            return patientPhone;
        }

        public void setPatientPhone(String patientPhone) {
            this.patientPhone = patientPhone;
        }

        public String getPatientEmail() {
            return patientEmail;
        }

        public void setPatientEmail(String patientEmail) {
            this.patientEmail = patientEmail;
        }

        public String getPatientGender() {
            return patientGender;
        }

        public void setPatientGender(String patientGender) {
            this.patientGender = patientGender;
        }

        public LocalDate getPatientDob() {
            return patientDob;
        }

        public void setPatientDob(LocalDate patientDob) {
            this.patientDob = patientDob;
        }

        public Long getDoctorId() {
            return doctorId;
        }

        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }

        public String getDoctorName() {
            return doctorName;
        }

        public void setDoctorName(String doctorName) {
            this.doctorName = doctorName;
        }

        public String getDoctorCode() {
            return doctorCode;
        }

        public void setDoctorCode(String doctorCode) {
            this.doctorCode = doctorCode;
        }

        public String getDoctorSpecialty() {
            return doctorSpecialty;
        }

        public void setDoctorSpecialty(String doctorSpecialty) {
            this.doctorSpecialty = doctorSpecialty;
        }

        public Long getDepartmentId() {
            return departmentId;
        }

        public void setDepartmentId(Long departmentId) {
            this.departmentId = departmentId;
        }

        public String getDepartmentName() {
            return departmentName;
        }

        public void setDepartmentName(String departmentName) {
            this.departmentName = departmentName;
        }

        public Long getReceptionistId() {
            return receptionistId;
        }

        public void setReceptionistId(Long receptionistId) {
            this.receptionistId = receptionistId;
        }

        public String getReceptionistName() {
            return receptionistName;
        }

        public void setReceptionistName(String receptionistName) {
            this.receptionistName = receptionistName;
        }

        public LocalDate getAppointmentDate() {
            return appointmentDate;
        }

        public void setAppointmentDate(LocalDate appointmentDate) {
            this.appointmentDate = appointmentDate;
        }

        public LocalTime getAppointmentTime() {
            return appointmentTime;
        }

        public void setAppointmentTime(LocalTime appointmentTime) {
            this.appointmentTime = appointmentTime;
        }

        public String getSymptomsSummary() {
            return symptomsSummary;
        }

        public void setSymptomsSummary(String symptomsSummary) {
            this.symptomsSummary = symptomsSummary;
        }

        public String getBookingChannel() {
            return bookingChannel;
        }

        public void setBookingChannel(String bookingChannel) {
            this.bookingChannel = bookingChannel;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }

        public String getCancellationReason() {
            return cancellationReason;
        }

        public void setCancellationReason(String cancellationReason) {
            this.cancellationReason = cancellationReason;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }

        public List<AppointmentReminderDto> getReminders() {
            return reminders;
        }

        public void setReminders(List<AppointmentReminderDto> reminders) {
            this.reminders = reminders;
        }
    }

    public static class AppointmentStatsDto {
        private LocalDate date;
        private long total;
        private long pending;
        private long confirmed;
        private long checkedIn;
        private long completed;
        private long cancelled;
        private long noShow;

        public AppointmentStatsDto() {}

        public AppointmentStatsDto(LocalDate date, long total, long pending, long confirmed,
                                   long checkedIn, long completed, long cancelled, long noShow) {
            this.date = date;
            this.total = total;
            this.pending = pending;
            this.confirmed = confirmed;
            this.checkedIn = checkedIn;
            this.completed = completed;
            this.cancelled = cancelled;
            this.noShow = noShow;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public long getTotal() {
            return total;
        }

        public void setTotal(long total) {
            this.total = total;
        }

        public long getPending() {
            return pending;
        }

        public void setPending(long pending) {
            this.pending = pending;
        }

        public long getConfirmed() {
            return confirmed;
        }

        public void setConfirmed(long confirmed) {
            this.confirmed = confirmed;
        }

        public long getCheckedIn() {
            return checkedIn;
        }

        public void setCheckedIn(long checkedIn) {
            this.checkedIn = checkedIn;
        }

        public long getCompleted() {
            return completed;
        }

        public void setCompleted(long completed) {
            this.completed = completed;
        }

        public long getCancelled() {
            return cancelled;
        }

        public void setCancelled(long cancelled) {
            this.cancelled = cancelled;
        }

        public long getNoShow() {
            return noShow;
        }

        public void setNoShow(long noShow) {
            this.noShow = noShow;
        }
    }
}
