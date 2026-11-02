package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.AppointmentReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentReminderRepository extends JpaRepository<AppointmentReminder, Long> {

    List<AppointmentReminder> findByAppointmentIdOrderBySentAtDesc(Long appointmentId);

    List<AppointmentReminder> findTop50ByOrderBySentAtDesc();
}
