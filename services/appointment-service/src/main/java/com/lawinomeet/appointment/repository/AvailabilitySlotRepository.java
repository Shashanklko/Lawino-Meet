package com.lawinomeet.appointment.repository;

import com.lawinomeet.appointment.entity.AvailabilitySlot;
import com.lawinomeet.appointment.entity.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {

    Optional<AvailabilitySlot> findByPublicId(String publicId);

    List<AvailabilitySlot> findByLawyerUserPublicIdAndSlotStatusAndStartTimeAfterOrderByStartTimeAsc(
            String lawyerUserPublicId, SlotStatus slotStatus, Instant startTime);

    List<AvailabilitySlot> findByLawyerUserPublicIdAndStartTimeBetweenOrderByStartTimeAsc(
            String lawyerUserPublicId, Instant startTime, Instant endTime);

    List<AvailabilitySlot> findByLawyerUserPublicIdOrderByStartTimeAsc(String lawyerUserPublicId);

    @Query("SELECT COUNT(s) > 0 FROM AvailabilitySlot s " +
           "WHERE s.lawyerUserPublicId = :lawyerId " +
           "AND s.slotStatus != com.lawinomeet.appointment.entity.SlotStatus.BLOCKED " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    boolean hasOverlappingSlot(@Param("lawyerId") String lawyerId,
                               @Param("startTime") Instant startTime,
                               @Param("endTime") Instant endTime);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AvailabilitySlot s SET s.slotStatus = :newStatus, s.updatedAt = :now " +
           "WHERE s.publicId = :publicId AND s.slotStatus = :expectedStatus")
    int updateSlotStatusConditionally(@Param("publicId") String publicId,
                                      @Param("expectedStatus") SlotStatus expectedStatus,
                                      @Param("newStatus") SlotStatus newStatus,
                                      @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AvailabilitySlot s SET s.slotStatus = :newStatus, s.updatedAt = :now " +
           "WHERE s.id = :slotId")
    int updateSlotStatusById(@Param("slotId") Long slotId,
                             @Param("newStatus") SlotStatus newStatus,
                             @Param("now") Instant now);
}
