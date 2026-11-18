package com.lawinomeet.chat.controller;

import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.security.UserPrincipal;
import com.lawinomeet.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void handleIncomingChatMessage(@Payload Map<String, Object> payload, Principal principal) {
        log.info("Received WebSocket chat message payload: {}", payload);
        try {
            String conversationPublicId = (String) payload.get("conversationPublicId");
            String content = (String) payload.get("content");

            if (conversationPublicId != null && content != null && !content.trim().isEmpty()) {
                if (principal instanceof UserPrincipal userPrincipal) {
                    ChatMessageResponse response = chatService.sendMessageToConversation(
                            userPrincipal, conversationPublicId, content.trim());
                    log.info("Persisted and broadcasted WebSocket chat message {}", response.getPublicId());
                } else {
                    log.warn("Cannot persist chat message: principal is not an authenticated UserPrincipal ({})", principal);
                }
            }
        } catch (Exception e) {
            log.error("Error persisting and routing WebSocket chat message: {}", e.getMessage(), e);
        }
    }
}
