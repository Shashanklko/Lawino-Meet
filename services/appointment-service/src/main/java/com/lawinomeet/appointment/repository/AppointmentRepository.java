package com.lawinomeet.appointment.repository;

import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByPublicId(String publicId);

    Optional<Appointment> findByShortUid(String shortUid);

    List<Appointment> findByClientUserPublicIdOrderByRequestedAtDesc(String clientUserPublicId);

    List<Appointment> findByLawyerUserPublicIdOrderByRequestedAtDesc(String lawyerUserPublicId);

    List<Appointment> findByLawyerUserPublicIdAndAppointmentStatusOrderByRequestedAtDesc(
            String lawyerUserPublicId, AppointmentStatus status);

    List<Appointment> findByFirmPublicIdOrderByRequestedAtDesc(String firmPublicId);

    List<Appointment> findByAppointmentStatusAndResponseDeadlineBefore(AppointmentStatus status, Instant deadline);

    List<Appointment> findByAppointmentStatusAndAutoReleaseAtBefore(AppointmentStatus status, Instant autoReleaseDeadline);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
           "WHERE a.lawyerUserPublicId = :lawyerId " +
           "AND a.appointmentStatus IN (com.lawinomeet.appointment.entity.AppointmentStatus.PENDING, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.AWAITING_PAYMENT, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.CONFIRMED, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.IN_PROGRESS) " +
           "AND ((a.startTime IS NOT NULL AND a.startTime < :endTime AND a.endTime > :startTime) " +
           "     OR (a.slot IS NOT NULL AND a.slot.startTime < :endTime AND a.slot.endTime > :startTime))")
    boolean hasLawyerActiveAppointmentConflict(@Param("lawyerId") String lawyerId,
                                               @Param("startTime") Instant startTime,
                                               @Param("endTime") Instant endTime);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
           "WHERE a.clientUserPublicId = :clientId " +
           "AND a.appointmentStatus IN (com.lawinomeet.appointment.entity.AppointmentStatus.PENDING, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.AWAITING_PAYMENT, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.CONFIRMED, " +
           "                             com.lawinomeet.appointment.entity.AppointmentStatus.IN_PROGRESS) " +
           "AND ((a.startTime IS NOT NULL AND a.startTime < :endTime AND a.endTime > :startTime) " +
           "     OR (a.slot IS NOT NULL AND a.slot.startTime < :endTime AND a.slot.endTime > :startTime))")
    boolean hasClientActiveAppointmentConflict(@Param("clientId") String clientId,
                                               @Param("startTime") Instant startTime,
                                               @Param("endTime") Instant endTime);
}
