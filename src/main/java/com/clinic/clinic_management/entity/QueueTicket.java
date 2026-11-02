package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tickets")
public class QueueTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_code", unique = true, length = 50)
    private String ticketCode;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "ticket_number", nullable = false)
    private Integer ticketNumber;

    @Column(name = "priority", length = 30)
    private String priority = "NORMAL"; // NORMAL, PRIORITY, EMERGENCY

    @Column(name = "is_appointment")
    private Boolean isAppointment = false;

    @Column(name = "service_type", length = 150)
    private String serviceType;

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Column(name = "status", length = 30)
    private String status = "WAITING"; // WAITING, CALLED, SERVING, COMPLETED, SKIPPED

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "serving_at")
    private LocalDateTime servingAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "transfer_reason", length = 255)
    private String transferReason;

    @Column(name = "transferred_from_room_id")
    private Long transferredFromRoomId;

    @Column(name = "call_count")
    private Integer callCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public QueueTicket() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (queueDate == null) {
            queueDate = LocalDate.now();
        }
        if (callCount == null) {
            callCount = 0;
        }
        if (priority == null) {
            priority = "NORMAL";
        }
        if (status == null) {
            status = "WAITING";
        }
        if (isAppointment == null) {
            isAppointment = false;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public Integer getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(Integer ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Boolean getAppointment() {
        return isAppointment;
    }

    public void setAppointment(Boolean appointment) {
        isAppointment = appointment;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public LocalDate getQueueDate() {
        return queueDate;
    }

    public void setQueueDate(LocalDate queueDate) {
        this.queueDate = queueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCalledAt() {
        return calledAt;
    }

    public void setCalledAt(LocalDateTime calledAt) {
        this.calledAt = calledAt;
    }

    public LocalDateTime getServingAt() {
        return servingAt;
    }

    public void setServingAt(LocalDateTime servingAt) {
        this.servingAt = servingAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getTransferReason() {
        return transferReason;
    }

    public void setTransferReason(String transferReason) {
        this.transferReason = transferReason;
    }

    public Long getTransferredFromRoomId() {
        return transferredFromRoomId;
    }

    public void setTransferredFromRoomId(Long transferredFromRoomId) {
        this.transferredFromRoomId = transferredFromRoomId;
    }

    public Integer getCallCount() {
        return callCount;
    }

    public void setCallCount(Integer callCount) {
        this.callCount = callCount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
