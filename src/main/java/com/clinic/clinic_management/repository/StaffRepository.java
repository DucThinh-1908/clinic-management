package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);
    Optional<Staff> findByStaffCode(String staffCode);
    Optional<Staff> findByIdCardNumber(String idCardNumber);
    List<Staff> findByDepartmentId(Long departmentId);
    List<Staff> findByStatus(String status);
    boolean existsByStaffCode(String staffCode);
    boolean existsByUserId(Long userId);
    boolean existsByIdCardNumber(String idCardNumber);
}
