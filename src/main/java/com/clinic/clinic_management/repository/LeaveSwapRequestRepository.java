package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.LeaveSwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveSwapRequestRepository extends JpaRepository<LeaveSwapRequest, Long> {
    List<LeaveSwapRequest> findAllByOrderByCreatedAtDesc();
    List<LeaveSwapRequest> findByStaffIdOrderByCreatedAtDesc(Long staffId);
    List<LeaveSwapRequest> findByStatusOrderByCreatedAtDesc(String status);
}
