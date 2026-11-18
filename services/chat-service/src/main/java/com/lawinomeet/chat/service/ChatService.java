package com.lawinomeet.chat.service;

import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.dto.ConversationResponse;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.dto.UnreadChatCountResponse;
import com.lawinomeet.chat.entity.ChatMessage;
import com.lawinomeet.chat.entity.Conversation;
import com.lawinomeet.chat.exception.ApiException;
import com.lawinomeet.chat.repository.ChatMessageRepository;
import com.lawinomeet.chat.repository.ConversationRepository;
import com.lawinomeet.chat.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(UserPrincipal sender, SendMessageRequest request) {
        if (sender.getPublicId().equals(request.getRecipientUserPublicId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SELF_MESSAGING", "You cannot send messages to yourself.");
        }

        Conversation conversation = (request.getAppointmentPublicId() != null && !request.getAppointmentPublicId().isBlank())
                ? getOrCreateConversationForAppointment(
                        sender.getPublicId(), sender.getUsername(),
                        request.getRecipientUserPublicId(), request.getRecipientUsername(),
                        request.getAppointmentPublicId())
                : getOrCreateConversation(
                        sender.getPublicId(), sender.getUsername(),
                        request.getRecipientUserPublicId(), request.getRecipientUsername());

        Instant now = Instant.now();
        String snippet = request.getContent().length() > 450 ?
                request.getContent().substring(0, 450) + "..." : request.getContent();
        conversation.setLastMessageContent(snippet);
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);

        ChatMessage message = ChatMessage.builder()
                .publicId(UUID.randomUUID().toString())
                .conversation(conversation)
                .senderUserPublicId(sender.getPublicId())
                .senderUsername(sender.getUsername())
                .recipientUserPublicId(request.getRecipientUserPublicId())
                .recipientUsername(request.getRecipientUsername())
                .content(request.getContent())
                .isRead(false)
                .build();

        ChatMessage saved = messageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved);

        // Real-time WebSocket dispatch to recipient's private user queue and shared topics
        try {
            messagingTemplate.convertAndSendToUser(
                    request.getRecipientUserPublicId(),
                    "/queue/messages",
                    response
            );
            // Public topic broadcasts for reliable real-time updates across browsers
            messagingTemplate.convertAndSend("/topic/conversations/" + conversation.getPublicId(), response);
            messagingTemplate.convertAndSend("/topic/users/" + request.getRecipientUserPublicId() + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + sender.getPublicId() + "/messages", response);
            log.info("Dispatched WebSocket message {} to conversation {} and users", saved.getPublicId(), conversation.getPublicId());
        } catch (Exception e) {
            log.warn("WebSocket dispatch failed (client will fetch via REST): {}", e.getMessage());
        }

        return response;
    }

    @Transactional
    public ChatMessageResponse sendMessageToConversation(UserPrincipal sender, String conversationPublicId, String content) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(sender.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        String recipientPublicId = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoPublicId()
                : conversation.getParticipantOnePublicId();

        String recipientUsername = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoUsername()
                : conversation.getParticipantOneUsername();

        SendMessageRequest request = SendMessageRequest.builder()
                .recipientUserPublicId(recipientPublicId)
                .recipientUsername(recipientUsername)
                .content(content)
                .build();

        return sendMessage(sender, request);
    }

    @Transactional
    public ConversationResponse getOrCreateConversationResponse(UserPrincipal sender, String recipientPublicId) {
        return getOrCreateConversationForAppointmentResponse(sender, recipientPublicId, null, null);
    }

    public ConversationResponse getOrCreateConversationForAppointmentResponse(
            UserPrincipal sender, String recipientPublicId, String recipientUsername, String appointmentPublicId) {
        Conversation conv = (appointmentPublicId != null && !appointmentPublicId.isBlank())
                ? getOrCreateConversationForAppointment(sender.getPublicId(), sender.getUsername(), recipientPublicId, recipientUsername, appointmentPublicId)
                : getOrCreateConversation(sender.getPublicId(), sender.getUsername(), recipientPublicId, recipientUsername);
        long unreadCount = messageRepository.countByConversationIdAndRecipientUserPublicIdAndIsReadFalse(conv.getId(), sender.getPublicId());
        return ConversationResponse.fromEntity(conv, sender.getPublicId(), unreadCount);
    }

    public ConversationResponse getConversationByAppointmentResponse(UserPrincipal principal, String appointmentPublicId) {
        Conversation conv = conversationRepository.findByAppointmentPublicId(appointmentPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND",
                        "No conversation found for appointment " + appointmentPublicId));
        if (!conv.isParticipant(principal.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not a participant in this conversation.");
        }
        long unreadCount = messageRepository.countByConversationIdAndRecipientUserPublicIdAndIsReadFalse(conv.getId(), principal.getPublicId());
        return ConversationResponse.fromEntity(conv, principal.getPublicId(), unreadCount);
    }

    @Transactional
    public ChatMessageResponse sendAttachmentMessage(
            UserPrincipal sender, String conversationPublicId, String caption,
            ChatStorageService.StoredAttachment attachment) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(sender.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        String recipientPublicId = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoPublicId()
                : conversation.getParticipantOnePublicId();

        String recipientUsername = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoUsername()
                : conversation.getParticipantOneUsername();

        String messageContent = (caption != null && !caption.trim().isEmpty())
                ? caption.trim()
                : "[Document: " + attachment.fileName() + "]";

        Instant now = Instant.now();
        conversation.setLastMessageContent(messageContent);
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);

        String messageType = (attachment.contentType() != null && attachment.contentType().startsWith("image/")) ? "IMAGE" : "FILE";

        ChatMessage message = ChatMessage.builder()
                .publicId(UUID.randomUUID().toString())
                .conversation(conversation)
                .senderUserPublicId(sender.getPublicId())
                .senderUsername(sender.getUsername())
                .recipientUserPublicId(recipientPublicId)
                .recipientUsername(recipientUsername)
                .content(messageContent)
                .attachmentUrl(attachment.url())
                .attachmentName(attachment.fileName())
                .attachmentType(attachment.contentType())
                .attachmentSize(attachment.size())
                .messageType(messageType)
                .isRead(false)
                .build();

        ChatMessage saved = messageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved);

        try {
            messagingTemplate.convertAndSendToUser(
                    recipientPublicId,
                    "/queue/messages",
                    response
            );
            messagingTemplate.convertAndSend("/topic/conversations/" + conversation.getPublicId(), response);
            messagingTemplate.convertAndSend("/topic/users/" + recipientPublicId + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + sender.getPublicId() + "/messages", response);
            log.info("Dispatched WebSocket document message {} to user {} and conversation {}", saved.getPublicId(), recipientPublicId, conversation.getPublicId());
        } catch (Exception e) {
            log.warn("WebSocket dispatch failed for document: {}", e.getMessage());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(String userPublicId) {
        List<Conversation> list = conversationRepository
                .findByParticipantOnePublicIdOrParticipantTwoPublicIdOrderByLastMessageAtDesc(userPublicId, userPublicId);

        List<ConversationResponse> responses = new ArrayList<>();
        for (Conversation conv : list) {
            long unread = messageRepository
                    .countByConversationIdAndRecipientUserPublicIdAndIsReadFalse(conv.getId(), userPublicId);
            responses.add(ConversationResponse.fromEntity(conv, userPublicId, unread));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getConversationMessages(
            UserPrincipal principal, String conversationPublicId, int page, int size) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(principal.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<ChatMessage> pageResult = messageRepository
                .findByConversationIdOrderByCreatedAtDesc(conversation.getId(), pageable);

        List<ChatMessageResponse> messages = new ArrayList<>(
                pageResult.map(ChatMessageResponse::fromEntity).getContent());
        // Reverse so that messages are returned in chronological order
        Collections.reverse(messages);
        return messages;
    }

    @Transactional
    public int markConversationAsRead(UserPrincipal principal, String conversationPublicId) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(principal.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        int updated = messageRepository.markConversationMessagesAsRead(
                conversation.getId(), principal.getPublicId(), Instant.now());
        log.info("Marked {} messages as read in conversation {} for user {}",
                updated, conversationPublicId, principal.getUsername());
        return updated;
    }

    @Transactional(readOnly = true)
    public UnreadChatCountResponse getTotalUnreadCount(String userPublicId) {
        long count = messageRepository.countByRecipientUserPublicIdAndIsReadFalse(userPublicId);
        return UnreadChatCountResponse.builder().totalUnreadCount(count).build();
    }

    private Conversation getOrCreateConversationForAppointment(
            String user1Id, String user1Name, String user2Id, String user2Name, String appointmentPublicId) {
        return conversationRepository.findByAppointmentPublicId(appointmentPublicId)
                .orElseGet(() -> {
                    boolean isOrder = user1Id.compareTo(user2Id) < 0;
                    String p1Id = isOrder ? user1Id : user2Id;
                    String p1Name = isOrder ? user1Name : user2Name;
                    String p2Id = isOrder ? user2Id : user1Id;
                    String p2Name = isOrder ? user2Name : user1Name;

                    Conversation conv = Conversation.builder()
                            .publicId(UUID.randomUUID().toString())
                            .appointmentPublicId(appointmentPublicId)
                            .participantOnePublicId(p1Id)
                            .participantOneUsername(p1Name)
                            .participantTwoPublicId(p2Id)
                            .participantTwoUsername(p2Name)
                            .lastMessageAt(Instant.now())
                            .build();

                    Conversation saved = conversationRepository.save(conv);
                    log.info("Created new isolated chat conversation {} for appointment {} between {} and {}",
                            saved.getPublicId(), appointmentPublicId, p1Id, p2Id);
                    return saved;
                });
    }

    private Conversation getOrCreateConversation(String user1Id, String user1Name, String user2Id, String user2Name) {
        return conversationRepository.findConversationBetween(user1Id, user2Id)
                .orElseGet(() -> {
                    // Canonical deterministic participant ordering
                    boolean isOrder = user1Id.compareTo(user2Id) < 0;
                    String p1Id = isOrder ? user1Id : user2Id;
                    String p1Name = isOrder ? user1Name : user2Name;
                    String p2Id = isOrder ? user2Id : user1Id;
                    String p2Name = isOrder ? user2Name : user1Name;

                    Conversation conv = Conversation.builder()
                            .publicId(UUID.randomUUID().toString())
                            .participantOnePublicId(p1Id)
                            .participantOneUsername(p1Name)
                            .participantTwoPublicId(p2Id)
                            .participantTwoUsername(p2Name)
                            .lastMessageAt(Instant.now())
                            .build();

                    Conversation saved = conversationRepository.save(conv);
                    log.info("Created new chat conversation {} between {} and {}",
                            saved.getPublicId(), p1Id, p2Id);
                    return saved;
                });
    }
}
