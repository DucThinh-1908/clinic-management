package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.WorkShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {
    List<WorkShift> findAllByOrderByStartTimeAsc();
}
