package com.lawinomeet.meeting.repository;

import com.lawinomeet.meeting.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingRoomId(Long roomId);

    Optional<MeetingParticipant> findTopByMeetingRoomIdAndUserPublicIdOrderByJoinedAtDesc(Long roomId, String userPublicId);
}
