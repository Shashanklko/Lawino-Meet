package com.jurisone.chat.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.jurisone.chat.enums.ChatStatus;
import com.jurisone.chat.model.ChatSession;


public interface ChatSessionRepository extends MongoRepository<ChatSession, String>{

    List<ChatSession> findByUserId(Long userId);
    List<ChatSession> findByProfessionalId(Long professionalId);
    List<ChatSession> findByUserIdAndStatus(Long userId, ChatStatus status);
    List<ChatSession> findByProfessionalIdAndStatus(Long professionalId, ChatStatus status);
}
