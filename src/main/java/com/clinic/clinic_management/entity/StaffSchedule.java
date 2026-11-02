package com.clinic.clinic_management.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_schedules", uniqueConstraints = {
    @UniqueConstraint(name = "uk_staff_shift_date", columnNames = {"staff_id", "shift_id", "work_date"})
})
public class StaffSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "shift_id", nullable = false)
    private Long shiftId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "status", length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, ATTENDED, ABSENT, CANCELLED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public StaffSchedule() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public Long getShiftId() {
        return shiftId;
    }

    public void setShiftId(Long shiftId) {
        this.shiftId = shiftId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
