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

    List<Conversation> findByParticipantOnePublicIdOrParticipantTwoPublicIdOrderByLastMessageAtDesc(
            String participantOne, String participantTwo);

    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participantOnePublicId = :u1 AND c.participantTwoPublicId = :u2) OR " +
           "(c.participantOnePublicId = :u2 AND c.participantTwoPublicId = :u1)")
    Optional<Conversation> findConversationBetween(@Param("u1") String u1, @Param("u2") String u2);
}
