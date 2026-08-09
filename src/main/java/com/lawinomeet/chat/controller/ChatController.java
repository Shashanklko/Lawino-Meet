package com.lawinomeet.chat.controller;

import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.dto.StartChatRequest;
import com.lawinomeet.chat.model.ChatSession;
import com.lawinomeet.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.lawinomeet.common.response.ApiResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // --- REST ENDPOINTS (HTTP) ---

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<ChatSession>> startChat(@NonNull @RequestBody StartChatRequest request) {
        ChatSession session = chatService.startSession(request);
        return ResponseEntity.ok(ApiResponse.success(session, "Chat session started successfully."));
    }

    @GetMapping("/{sessionId}/history")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getHistory(@NonNull @PathVariable String sessionId) {
        List<ChatMessageResponse> history = chatService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.success(history, "Chat history retrieved."));
    }

    @PostMapping("/{sessionId}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlock(@NonNull @PathVariable String sessionId) {
        chatService.unlockReply(sessionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Chat unlocked successfully."));
    }

    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<ApiResponse<List<ChatSession>>> getUserSessions(@NonNull @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getUserSessions(userId), "User sessions retrieved."));
    }

    @GetMapping("/sessions/pro/{proId}")
    public ResponseEntity<ApiResponse<List<ChatSession>>> getProfessionalSessions(@NonNull @PathVariable Long proId) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getProfessionalSessions(proId), "Professional sessions retrieved."));
    }

    // --- WEBSOCKET HANDLERS (STOMP) ---

    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request) {
        // 1. Process message via Service (Business Rules)
        ChatMessageResponse response = chatService.sendMessage(request);

        // 2. Broadcast to the specific session topic
        // Clients should subscribe to: /topic/chat/{sessionId}
        messagingTemplate.convertAndSend("/topic/chat/" + request.getChatSessionId(), response);
    }

    @MessageMapping("/chat.endByUser")
    public void endByUser(String sessionId) {
        chatService.endChatByUser(sessionId);
        // Notify all participants about resolution
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId + "/status", "RESOLVED");
    }

    @MessageMapping("/chat.endByProfessional")
    public void endByProfessional(String sessionId) {
        chatService.endChatByProfessional(sessionId);
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId + "/status", "PENDING_RESOLUTION");
    }
}
