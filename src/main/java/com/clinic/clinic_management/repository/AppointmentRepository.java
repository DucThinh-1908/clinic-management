package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByAppointmentTimeAsc(Long doctorId, LocalDate appointmentDate);

    List<Appointment> findByAppointmentDateOrderByAppointmentTimeAsc(LocalDate appointmentDate);

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNotIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Collection<String> statuses
    );

    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndIdNotAndStatusNotIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            Long id,
            Collection<String> statuses
    );

    long countByAppointmentDate(LocalDate appointmentDate);

    long countByAppointmentDateAndStatus(LocalDate appointmentDate, String status);

    long countByAppointmentDateAndDoctorId(LocalDate appointmentDate, Long doctorId);

    long countByAppointmentDateAndDoctorIdAndStatus(LocalDate appointmentDate, Long doctorId, String status);

    @Query("SELECT a FROM Appointment a WHERE (:date IS NULL OR a.appointmentDate = :date) " +
           "AND (:doctorId IS NULL OR a.doctorId = :doctorId) " +
           "AND (:departmentId IS NULL OR a.departmentId = :departmentId) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:patientId IS NULL OR a.patientId = :patientId) " +
           "ORDER BY a.appointmentDate ASC, a.appointmentTime ASC")
    List<Appointment> searchAppointments(
            @Param("date") LocalDate date,
            @Param("doctorId") Long doctorId,
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            @Param("patientId") Long patientId
    );

    List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(LocalDate start, LocalDate end);

    long countByAppointmentDateBetween(LocalDate start, LocalDate end);

    long countByAppointmentDateBetweenAndStatus(LocalDate start, LocalDate end, String status);
}
