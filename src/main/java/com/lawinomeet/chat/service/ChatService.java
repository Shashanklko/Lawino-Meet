package com.lawinomeet.chat.service;

import java.util.List;

import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.dto.StartChatRequest;
import com.lawinomeet.chat.model.ChatSession;

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
