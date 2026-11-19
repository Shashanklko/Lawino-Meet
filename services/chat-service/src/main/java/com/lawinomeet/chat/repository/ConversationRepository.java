package com.lawinomeet.chat.repository;

import com.lawinomeet.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByPublicId(String publicId);

    Optional<Conversation> findByAppointmentPublicId(String appointmentPublicId);

    List<Conversation> findByParticipantOnePublicIdOrParticipantTwoPublicIdOrderByLastMessageAtDesc(
            String participantOne, String participantTwo);

    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participantOnePublicId = :u1 AND c.participantTwoPublicId = :u2) OR " +
           "(c.participantOnePublicId = :u2 AND c.participantTwoPublicId = :u1) " +
           "ORDER BY c.lastMessageAt DESC")
    List<Conversation> findAllConversationsBetween(@Param("u1") String u1, @Param("u2") String u2);

    default Optional<Conversation> findConversationBetween(String u1, String u2) {
        return findAllConversationsBetween(u1, u2).stream().findFirst();
    }
}
