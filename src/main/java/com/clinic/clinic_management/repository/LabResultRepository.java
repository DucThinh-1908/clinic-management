package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {
    List<LabResult> findByLabOrderId(Long labOrderId);
    List<LabResult> findByLabOrderIdIn(List<Long> labOrderIds);
}
