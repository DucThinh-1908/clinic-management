package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.ClinicRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicRoomRepository extends JpaRepository<ClinicRoom, Long> {
    Optional<ClinicRoom> findByRoomNumber(String roomNumber);
    List<ClinicRoom> findByDepartmentId(Long departmentId);
    List<ClinicRoom> findByIsAvailableTrue();
    boolean existsByRoomNumber(String roomNumber);
}
