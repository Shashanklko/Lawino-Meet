package com.lawinomeet.chat.controller;

import com.lawinomeet.chat.dto.*;
import com.lawinomeet.chat.security.UserPrincipal;
import com.lawinomeet.chat.service.ChatService;
import com.lawinomeet.chat.service.ChatStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatStorageService chatStorageService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse response = chatService.sendMessage(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Message sent successfully", response));
    }

    @PostMapping(value = "/conversations/{conversationPublicId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ChatMessageResponse>> uploadAttachment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationPublicId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) {
        ChatStorageService.StoredAttachment attachment = chatStorageService.storeAttachment(file, conversationPublicId);
        ChatMessageResponse response = chatService.sendAttachmentMessage(principal, conversationPublicId, caption, attachment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Attachment sent successfully", response));
    }

    @GetMapping("/files/**")
    public ResponseEntity<Resource> serveLocalFile(HttpServletRequest request) {
        try {
            String fullPath = request.getRequestURI();
            String relativePath = fullPath.substring(fullPath.indexOf("/files/") + 7);
            Path filePath = Paths.get("./uploads", relativePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = request.getServletContext().getMimeType(filePath.toString());
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
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
