package com.lawinomeetMeetmeet.chat.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lawinomeetMeetmeet.chat.model.ChatMessage;

public interface ChatMessageRepository extends MongoRepository<ChatMessage , String> {

    List<ChatMessage> findByChatSessionIdOrderByTimestampAsc(String chatSessionId);
    
}
