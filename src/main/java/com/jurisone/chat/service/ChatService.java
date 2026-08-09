package com.jurisone.chat.service;

import java.util.List;

import com.jurisone.chat.dto.ChatMessageResponse;
import com.jurisone.chat.dto.SendMessageRequest;
import com.jurisone.chat.dto.StartChatRequest;
import com.jurisone.chat.model.ChatSession;

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
