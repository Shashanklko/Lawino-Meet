package com.lawinomeetMeetmeet.chat.service;

import java.util.List;

import com.lawinomeetMeetmeet.chat.dto.ChatMessageResponse;
import com.lawinomeetMeetmeet.chat.dto.SendMessageRequest;
import com.lawinomeetMeetmeet.chat.dto.StartChatRequest;
import com.lawinomeetMeetmeet.chat.model.ChatSession;

import org.springframework.lang.NonNull;

public interface ChatService {
    
    @NonNull 
    public ChatSession startSession(@NonNull StartChatRequest request);
    @NonNull
    public ChatMessageResponse sendMessage(@NonNull SendMessageRequest request);
    @NonNull
    public List<ChatMessageResponse> getChatHistory(@NonNull String chatSessionId);
    void endChatByUser(@NonNull String sessionId);
    void endChatByProfessional(@NonNull String sessionId);
    void unlockReply(@NonNull String sessionId);
    List<ChatSession> getUserSessions(@NonNull Long userId);
    List<ChatSession> getProfessionalSessions(@NonNull Long professionalId);
}
