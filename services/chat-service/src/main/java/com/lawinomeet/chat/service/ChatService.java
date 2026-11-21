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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
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

        return saveAndDispatchMessage(
                sender, conversation,
                request.getRecipientUserPublicId(), request.getRecipientUsername(),
                request.getContent(),
                request.getReplyToMessagePublicId(),
                request.getReplyToSenderName(),
                request.getReplyToContent()
        );
    }

    @Transactional
    public ChatMessageResponse sendMessageToConversation(UserPrincipal sender, String conversationPublicId, String content) {
        return sendMessageToConversation(sender, conversationPublicId, content, null, null, null);
    }

    @Transactional
    public ChatMessageResponse sendMessageToConversation(
            UserPrincipal sender, String conversationPublicId, String content,
            String replyToMessagePublicId, String replyToSenderName, String replyToContent) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(sender.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        if (conversation.isClosed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CONSULTATION_CONCLUDED",
                    "This consultation session has concluded. Please book a reappointment to continue messaging.");
        }

        String recipientPublicId = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoPublicId()
                : conversation.getParticipantOnePublicId();

        String recipientUsername = sender.getPublicId().equals(conversation.getParticipantOnePublicId())
                ? conversation.getParticipantTwoUsername()
                : conversation.getParticipantOneUsername();

        return saveAndDispatchMessage(
                sender, conversation, recipientPublicId, recipientUsername, content,
                replyToMessagePublicId, replyToSenderName, replyToContent
        );
    }

    private ChatMessageResponse saveAndDispatchMessage(
            UserPrincipal sender, Conversation conversation,
            String recipientPublicId, String recipientUsername, String content) {
        return saveAndDispatchMessage(sender, conversation, recipientPublicId, recipientUsername, content, null, null, null);
    }

    private ChatMessageResponse saveAndDispatchMessage(
            UserPrincipal sender, Conversation conversation,
            String recipientPublicId, String recipientUsername, String content,
            String replyToMessagePublicId, String replyToSenderName, String replyToContent) {
        if (conversation.isClosed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CONSULTATION_CONCLUDED",
                    "This consultation session has concluded. Please book a reappointment to continue messaging.");
        }
        Instant now = Instant.now();

        // Debounce deduplication: if exact same content from same sender within 2.5 seconds, return existing
        Optional<ChatMessage> recent = messageRepository.findTopByConversationIdAndSenderUserPublicIdOrderByCreatedAtDesc(
                conversation.getId(), sender.getPublicId());
        if (recent.isPresent()) {
            ChatMessage r = recent.get();
            if (content.equals(r.getContent()) && java.time.Duration.between(r.getCreatedAt(), now).toMillis() < 2500) {
                log.info("Duplicate chat message suppressed for sender {} in conversation {}", sender.getUsername(), conversation.getPublicId());
                return ChatMessageResponse.fromEntity(r, sender.getPublicId());
            }
        }

        String snippet = content.length() > 450 ? content.substring(0, 450) + "..." : content;
        conversation.setLastMessageContent(snippet);
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);

        ChatMessage message = ChatMessage.builder()
                .publicId(UUID.randomUUID().toString())
                .conversation(conversation)
                .senderUserPublicId(sender.getPublicId())
                .senderUsername(sender.getUsername())
                .recipientUserPublicId(recipientPublicId)
                .recipientUsername(recipientUsername)
                .content(content)
                .replyToMessagePublicId(replyToMessagePublicId)
                .replyToSenderName(replyToSenderName)
                .replyToContent(replyToContent)
                .isRead(false)
                .build();

        ChatMessage saved = messageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved, sender.getPublicId());

        try {
            messagingTemplate.convertAndSendToUser(
                    recipientPublicId,
                    "/queue/messages",
                    response
            );
            messagingTemplate.convertAndSend("/topic/conversations/" + conversation.getPublicId(), response);
            messagingTemplate.convertAndSend("/topic/users/" + recipientPublicId + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + sender.getPublicId() + "/messages", response);
            log.info("Dispatched WebSocket message {} to conversation {} and users", saved.getPublicId(), conversation.getPublicId());
        } catch (Exception e) {
            log.warn("WebSocket dispatch failed (client will fetch via REST): {}", e.getMessage());
        }

        return response;
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

        if (conversation.isClosed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CONSULTATION_CONCLUDED",
                    "This consultation session has concluded. Please book a reappointment to continue messaging.");
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

        List<ChatMessageResponse> messages = new ArrayList<>();
        for (ChatMessage msg : pageResult.getContent()) {
            ChatMessageResponse resp = ChatMessageResponse.fromEntity(msg, principal.getPublicId());
            if (resp != null && !resp.isDeletedForMe()) {
                messages.add(resp);
            }
        }
        // Reverse so that messages are returned in chronological order
        Collections.reverse(messages);
        return messages;
    }

    @Transactional
    public ChatMessageResponse deleteMessage(UserPrincipal principal, String messagePublicId, String deleteType) {
        ChatMessage message = messageRepository.findByPublicId(messagePublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MESSAGE_NOT_FOUND", "Message not found."));

        Conversation conv = message.getConversation();
        if (!conv.isParticipant(principal.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not a participant in this conversation.");
        }

        if ("EVERYONE".equalsIgnoreCase(deleteType)) {
            if (!principal.getPublicId().equals(message.getSenderUserPublicId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the message sender can delete a message for everyone.");
            }
            message.setDeletedForEveryone(true);
            message.setContent("This message was deleted");
            message.setAttachmentUrl(null);
            message.setAttachmentName(null);
            message.setAttachmentType(null);
            message.setAttachmentSize(null);
            message.setMessageType("DELETED");
        } else {
            // Delete for self (current user only)
            String current = message.getDeletedForUserIds();
            if (current == null || current.isBlank()) {
                message.setDeletedForUserIds(principal.getPublicId());
            } else {
                List<String> ids = new ArrayList<>(Arrays.asList(current.split(",")));
                if (!ids.contains(principal.getPublicId())) {
                    ids.add(principal.getPublicId());
                    message.setDeletedForUserIds(String.join(",", ids));
                }
            }
        }

        ChatMessage saved = messageRepository.save(message);
        ChatMessageResponse response = ChatMessageResponse.fromEntity(saved, principal.getPublicId());

        // Broadcast deletion event via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conv.getPublicId(), response);
            messagingTemplate.convertAndSend("/topic/users/" + message.getRecipientUserPublicId() + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + message.getSenderUserPublicId() + "/messages", response);
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for delete message: {}", e.getMessage());
        }

        return response;
    }

    @Transactional
    public ConversationResponse closeConversation(UserPrincipal principal, String conversationPublicId) {
        Conversation conversation = conversationRepository.findByPublicId(conversationPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found."));

        if (!conversation.isParticipant(principal.getPublicId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not a participant in this conversation.");
        }

        conversation.setClosed(true);
        Conversation saved = conversationRepository.save(conversation);
        log.info("Conversation {} marked concluded and closed by user {}", conversationPublicId, principal.getUsername());
        long unreadCount = messageRepository.countByConversationIdAndRecipientUserPublicIdAndIsReadFalse(saved.getId(), principal.getPublicId());
        return ConversationResponse.fromEntity(saved, principal.getPublicId(), unreadCount);
    }

    @Transactional
    public void closeConversationByAppointment(String appointmentPublicId) {
        if (appointmentPublicId == null || appointmentPublicId.isBlank()) return;
        conversationRepository.findByAppointmentPublicId(appointmentPublicId).ifPresent(c -> {
            c.setClosed(true);
            conversationRepository.save(c);
            log.info("Closed chat conversation {} for appointment {}", c.getPublicId(), appointmentPublicId);
        });
    }

    @Transactional
    public void reopenConversationByAppointment(String appointmentPublicId, String clientPublicId, String lawyerPublicId) {
        if (appointmentPublicId != null && !appointmentPublicId.isBlank()) {
            conversationRepository.findByAppointmentPublicId(appointmentPublicId).ifPresent(c -> {
                c.setClosed(false);
                conversationRepository.save(c);
                log.info("Reopened chat conversation {} for appointment {}", c.getPublicId(), appointmentPublicId);
            });
        }
        if (clientPublicId != null && lawyerPublicId != null) {
            conversationRepository.findConversationBetween(clientPublicId, lawyerPublicId).ifPresent(c -> {
                c.setClosed(false);
                if (appointmentPublicId != null && !appointmentPublicId.isBlank()) {
                    c.setAppointmentPublicId(appointmentPublicId);
                }
                conversationRepository.save(c);
                log.info("Reopened chat conversation {} between {} and {}", c.getPublicId(), clientPublicId, lawyerPublicId);
            });
        }
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
        if (appointmentPublicId != null && !appointmentPublicId.isBlank()) {
            var existingByApt = conversationRepository.findByAppointmentPublicId(appointmentPublicId);
            if (existingByApt.isPresent()) {
                Conversation c = existingByApt.get();
                if (c.isClosed()) {
                    c.setClosed(false);
                    conversationRepository.save(c);
                }
                return c;
            }
        }

        var existingBetween = conversationRepository.findConversationBetween(user1Id, user2Id);
        if (existingBetween.isPresent()) {
            Conversation conv = existingBetween.get();
            boolean saveNeeded = false;
            if (appointmentPublicId != null && !appointmentPublicId.isBlank() && conv.getAppointmentPublicId() == null) {
                conv.setAppointmentPublicId(appointmentPublicId);
                saveNeeded = true;
            }
            if (appointmentPublicId != null && !appointmentPublicId.isBlank() && conv.isClosed()) {
                conv.setClosed(false);
                saveNeeded = true;
            }
            if (saveNeeded) {
                conversationRepository.save(conv);
            }
            return conv;
        }

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
        log.info("Created new unified chat conversation {} for appointment {} between {} and {}",
                saved.getPublicId(), appointmentPublicId, p1Id, p2Id);
        return saved;
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
