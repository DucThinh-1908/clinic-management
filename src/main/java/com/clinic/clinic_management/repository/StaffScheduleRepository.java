package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.StaffSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffScheduleRepository extends JpaRepository<StaffSchedule, Long> {
    List<StaffSchedule> findByWorkDateBetweenOrderByWorkDateAscShiftIdAsc(LocalDate startDate, LocalDate endDate);
    List<StaffSchedule> findByStaffIdAndWorkDateBetweenOrderByWorkDateAsc(Long staffId, LocalDate startDate, LocalDate endDate);
    List<StaffSchedule> findByWorkDateOrderByShiftIdAsc(LocalDate workDate);
    Optional<StaffSchedule> findByStaffIdAndShiftIdAndWorkDate(Long staffId, Long shiftId, LocalDate workDate);
    Optional<StaffSchedule> findByRoomIdAndShiftIdAndWorkDate(Long roomId, Long shiftId, LocalDate workDate);
    List<StaffSchedule> findByStaffIdAndWorkDate(Long staffId, LocalDate workDate);
    boolean existsByStaffIdAndShiftIdAndWorkDate(Long staffId, Long shiftId, LocalDate workDate);
    boolean existsByRoomIdAndShiftIdAndWorkDate(Long roomId, Long shiftId, LocalDate workDate);
}
