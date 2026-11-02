package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByStaffIdAndAttendanceDate(Long staffId, LocalDate attendanceDate);
    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate startDate, LocalDate endDate);
    List<Attendance> findByStaffIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(Long staffId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByAttendanceDateOrderByCreatedAtDesc(LocalDate attendanceDate);
    boolean existsByStaffIdAndAttendanceDate(Long staffId, LocalDate attendanceDate);
}
