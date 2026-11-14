package com.lawinomeet.meeting.repository;

import com.lawinomeet.meeting.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {

    Optional<MeetingRoom> findByPublicId(String publicId);

    Optional<MeetingRoom> findByAppointmentPublicId(String appointmentPublicId);

    List<MeetingRoom> findByClientUserPublicIdOrLawyerUserPublicIdOrderByCreatedAtDesc(
            String clientUserPublicId, String lawyerUserPublicId);
}
