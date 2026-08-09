package com.lawinomeet.chat.service;

import java.util.List;
import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.dto.StartChatRequest;
import com.lawinomeet.chat.model.ChatSession;
import org.springframework.lang.NonNull;

public interface ChatService {
    @NonNull 
    ChatSession startSession(@NonNull StartChatRequest request);
    
    @NonNull
    ChatMessageResponse sendMessage(@NonNull SendMessageRequest request);
    
    @NonNull
    List<ChatMessageResponse> getMessagesBySessionId(@NonNull String chatSessionId);
    
    @NonNull
    List<ChatMessageResponse> getChatHistory(@NonNull String chatSessionId);

    @NonNull
    ChatSession getSessionById(@NonNull String sessionId);

    ChatSession unlockReply(@NonNull String sessionId);

    ChatSession endSessionByProfessional(@NonNull String sessionId);

    void endChatByUser(@NonNull String sessionId);

    void endChatByProfessional(@NonNull String sessionId);

    List<ChatSession> getUserSessions(@NonNull Long userId);

    List<ChatSession> getProfessionalSessions(@NonNull Long professionalId);
}
