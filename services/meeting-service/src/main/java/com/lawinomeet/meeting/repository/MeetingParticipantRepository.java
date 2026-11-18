package com.lawinomeet.meeting.repository;

import com.lawinomeet.meeting.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingRoomId(Long roomId);

    List<MeetingParticipant> findByMeetingRoomPublicId(String roomPublicId);

    Optional<MeetingParticipant> findByPublicId(String publicId);

    Optional<MeetingParticipant> findTopByMeetingRoomIdAndUserPublicIdOrderByJoinedAtDesc(Long roomId, String userPublicId);

    Optional<MeetingParticipant> findTopByMeetingRoomPublicIdAndUserPublicIdOrderByJoinedAtDesc(String roomPublicId, String userPublicId);
}
