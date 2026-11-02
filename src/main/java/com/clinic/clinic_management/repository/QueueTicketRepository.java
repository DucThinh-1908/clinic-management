package com.clinic.clinic_management.repository;

import com.clinic.clinic_management.entity.QueueTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    Optional<QueueTicket> findByTicketCode(String ticketCode);

    Optional<QueueTicket> findByAppointmentId(Long appointmentId);

    List<QueueTicket> findByRoomIdAndQueueDateOrderByTicketNumberAsc(Long roomId, LocalDate queueDate);

    List<QueueTicket> findByRoomIdAndQueueDateAndStatusInOrderByTicketNumberAsc(Long roomId, LocalDate queueDate, Collection<String> statuses);

    List<QueueTicket> findByQueueDateOrderByRoomIdAscTicketNumberAsc(LocalDate queueDate);

    @Query("SELECT q FROM QueueTicket q WHERE q.roomId = :roomId AND q.queueDate = :date " +
           "AND (:status IS NULL OR q.status = :status) " +
           "ORDER BY CASE " +
           "  WHEN q.status = 'SERVING' THEN 1 " +
           "  WHEN q.status = 'CALLED' THEN 2 " +
           "  WHEN q.status = 'WAITING' AND q.priority = 'EMERGENCY' THEN 3 " +
           "  WHEN q.status = 'WAITING' AND q.priority = 'PRIORITY' THEN 4 " +
           "  WHEN q.status = 'WAITING' THEN 5 " +
           "  ELSE 6 END, q.ticketNumber ASC")
    List<QueueTicket> findQueueByRoomAndDateWithPriority(
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("status") String status
    );

    @Query("SELECT COALESCE(MAX(q.ticketNumber), 0) FROM QueueTicket q WHERE q.roomId = :roomId AND q.queueDate = :date")
    int findMaxTicketNumberByRoomAndDate(@Param("roomId") Long roomId, @Param("date") LocalDate date);

    long countByRoomIdAndQueueDate(Long roomId, LocalDate queueDate);

    long countByRoomIdAndQueueDateAndStatus(Long roomId, LocalDate queueDate, String status);

    long countByQueueDate(LocalDate queueDate);

    long countByQueueDateAndStatus(LocalDate queueDate, String status);

    List<QueueTicket> findByPatientIdAndQueueDate(Long patientId, LocalDate queueDate);

    Optional<QueueTicket> findFirstByRoomIdAndQueueDateAndStatusInOrderByCalledAtDesc(
            Long roomId, LocalDate queueDate, Collection<String> statuses
    );
}
