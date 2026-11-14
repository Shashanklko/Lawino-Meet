package com.lawinomeet.chat.controller;

import com.lawinomeet.chat.dto.*;
import com.lawinomeet.chat.security.UserPrincipal;
import com.lawinomeet.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse response = chatService.sendMessage(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Message sent successfully", response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getMyConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationResponse> list = chatService.getMyConversations(principal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok("Conversations retrieved successfully", list));
    }

    @GetMapping("/conversations/{conversationPublicId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversationMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationPublicId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<ChatMessageResponse> messages = chatService.getConversationMessages(
                principal, conversationPublicId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Messages retrieved successfully", messages));
    }

    @PatchMapping("/conversations/{conversationPublicId}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markConversationAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationPublicId) {
        int readCount = chatService.markConversationAsRead(principal, conversationPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Conversation marked as read", Map.of("readCount", readCount)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadChatCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        UnreadChatCountResponse response = chatService.getTotalUnreadCount(principal.getPublicId());
        return ResponseEntity.ok(ApiResponse.ok("Unread chat count retrieved", response));
    }
}
