package com.lawinomeetMeetmeet.chat.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.lawinomeetMeetmeet.chat.dto.ChatMessageResponse;
import com.lawinomeetMeetmeet.chat.dto.SendMessageRequest;
import com.lawinomeetMeetmeet.chat.dto.StartChatRequest;
import com.lawinomeetMeetmeet.chat.enums.ChatStatus;
import com.lawinomeetMeetmeet.chat.model.ChatMessage;
import com.lawinomeetMeetmeet.chat.model.ChatSession;
import com.lawinomeetMeetmeet.chat.repository.ChatMessageRepository;
import com.lawinomeetMeetmeet.chat.repository.ChatSessionRepository;
import com.lawinomeetMeetmeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeetMeetmeet.user.repository.UserRepository;

import com.lawinomeetMeetmeet.common.exception.ResourceNotFoundException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ChatServiceImp implements ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    @Autowired 
    private UserRepository userRepository;
    @Autowired 
    private ProfessionalProfileRepository professionalProfileRepository;


    @Override
    @NonNull
    public ChatSession startSession(@NonNull StartChatRequest request) {
        ChatSession session = new ChatSession();
        session.setUserId(request.getUserId());
        session.setProfessionalId(request.getProfessionalId());
        session.setStatus(ChatStatus.AWAITING_REPLY);
        
        session.setTokensGranted(0);
        session.setTokensConsumed(0);
        session.setCreatedAt(LocalDateTime.now());
        session.setLastUpdateAt(LocalDateTime.now());

        ChatSession savedSession = chatSessionRepository.save(session);
        log.info("[CHAT] Started NEW SESSION: ID {} for User ID {} and Prof ID {}", 
                 savedSession.getId(), savedSession.getUserId(), savedSession.getProfessionalId());
        return savedSession;
    }

    @Autowired
    private com.lawinomeetMeetmeet.common.service.AuditLogService auditLogService;

    @Autowired
    private com.lawinomeetMeetmeet.ai.service.AiService aiService;

    @Override
    @NonNull
    public ChatMessageResponse sendMessage(@NonNull SendMessageRequest request) {
        String sId = request.getChatSessionId();
        if (sId == null) throw new RuntimeException("Session ID missing");

        ChatSession session = chatSessionRepository.findById(sId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));

        String content = request.getContent();
        
        // 🛡️ AI SECURITY GUARD (Python + Gemini Powered Delegate)
        // Blocking is BYPASSED if an official appointment has been scheduled and paid.
        boolean isPaid = session.getIsAppointmentPaid() != null && session.getIsAppointmentPaid();
        if (!isPaid && content != null && !content.trim().isEmpty()) {
            String aiSafetyResult = aiService.checkSafety(content);

            if (aiSafetyResult != null && aiSafetyResult.contains("BLOCKED")) {
                auditLogService.logAiBlock(
                    "Contact details blocked",
                    "Content: " + content,
                    String.valueOf(request.getSenderId()),
                    "USER" // Fallback role for individual chat participants
                );
                log.warn("AI Blocked a message containing contact details: {}", content);
                throw new RuntimeException("Sharing contact details is strictly blocked. Please schedule an appointment to exchange verified contact info.");
            }
        }

        ChatMessage message = new ChatMessage();
        message.setChatSessionId(sId);
        message.setSenderId(request.getSenderId());
        message.setReceiverId(request.getReceiverId());
        message.setContent(content);
        message.setType(request.getType());
        message.setTimestamp(LocalDateTime.now());

        // Token logic for User messages
        Long senderUserId = request.getSenderId();
        if (senderUserId != null && senderUserId.equals(session.getUserId())) {
            com.lawinomeetMeetmeet.user.entity.User user = userRepository.findById(senderUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            Integer balance = user.getGlobalTokenBalance();
            if (balance == null || balance <= 0) {
                throw new RuntimeException("Insufficient tokens. Please unlock this reply to continue.");
            }
            
            user.setGlobalTokenBalance(balance - 1);
            Integer consumedCount = session.getTokensConsumed();
            session.setTokensConsumed(consumedCount != null ? consumedCount + 1 : 1);
            userRepository.save(user);
            log.info("[TOKENS] Deducted 1 token from User {}. New Balance: {}", user.getEmail(), user.getGlobalTokenBalance());
        }

        // Locked reply logic for Lawyer's initial response
        if (senderUserId != null && senderUserId.equals(session.getProfessionalId()) && session.getStatus() == ChatStatus.AWAITING_REPLY) {
            message.setIsLocked(true);
            session.setStatus(ChatStatus.LOCKED_REPLY);
        }

        session.setLastUpdateAt(LocalDateTime.now());
        chatSessionRepository.save(session);
        log.info("[CHAT] MESSAGE SENT in Session: {} | Sender: {} | Type: {}", sId, request.getSenderId(), request.getType());
        
        ChatMessage savedMsg = chatMessageRepository.save(message);
        return mapToResponse(savedMsg, session.getStatus());
    }

    @Override
    @NonNull
    public List<ChatMessageResponse> getChatHistory(@NonNull String chatSessionId) {
        ChatSession session = chatSessionRepository.findById(chatSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        return chatMessageRepository.findByChatSessionIdOrderByTimestampAsc(chatSessionId)
                .stream()
                .map(msg -> mapToResponse(msg, session.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    public void endChatByUser(@NonNull String sId) {
        ChatSession session = chatSessionRepository.findById(sId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        session.setStatus(ChatStatus.RESOLVED);
        
        // ROLLOVER LOGIC
        Integer granted = session.getTokensGranted();
        Integer consumed = session.getTokensConsumed();
        int leftover = (granted != null ? granted : 0) - (consumed != null ? consumed : 0);
        
        if (leftover > 0) {
            Long userId = session.getUserId();
            if (userId != null) {
                userRepository.findById(userId).ifPresent(user -> {
                    Integer balance = user.getGlobalTokenBalance();
                    user.setGlobalTokenBalance(balance != null ? balance + leftover : leftover);
                    userRepository.save(user);
                });
            }
        }
        
        chatSessionRepository.save(session);
    }

    @Override
    public void endChatByProfessional(@NonNull String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        session.setProfessionalEndedChat(true);
        session.setStatus(ChatStatus.PENDING_RESOLUTION);
        chatSessionRepository.save(session);
    }

    @Override
    public void unlockReply(@NonNull String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (session.getStatus() == ChatStatus.LOCKED_REPLY) {
            session.setStatus(ChatStatus.ACTIVE);
            Integer grantedCount = session.getTokensGranted();
            session.setTokensGranted(grantedCount != null ? grantedCount + 10 : 10);
            
            Long professionalId = session.getProfessionalId();
            if (professionalId != null) {
                professionalProfileRepository.findByUserId(professionalId).ifPresent(prof -> {
                    Double fee = prof.getChatUnlockFee();
                    double earnings = (fee != null ? fee : 99.0) * 0.8;
                    Double currentBalance = prof.getWalletBalance();
                    prof.setWalletBalance(currentBalance != null ? currentBalance + earnings : earnings);
                    professionalProfileRepository.save(prof);
                    log.info("Professional ID: {} credited with earnings: {} for Session ID: {}", professionalId, earnings, sessionId);
                });
            }

            chatSessionRepository.save(session);
            log.info("[CHAT] Session ID: {} UNLOCKED and set to ACTIVE.", sessionId);
        }
    }

    @Override
    @NonNull
    public List<ChatSession> getUserSessions(@NonNull Long userId) {
        return chatSessionRepository.findByUserId(userId);
    }

    @Override
    @NonNull
    public List<ChatSession> getProfessionalSessions(@NonNull Long professionalId) {
        return chatSessionRepository.findByProfessionalId(professionalId);
    }

    @NonNull
    private ChatMessageResponse mapToResponse(@NonNull ChatMessage msg, ChatStatus status) {
        ChatMessageResponse res = new ChatMessageResponse();
        res.setId(msg.getId());
        res.setChatSessionId(msg.getChatSessionId());
        res.setSenderId(msg.getSenderId());
        res.setReceiverId(msg.getReceiverId());
        res.setType(msg.getType());
        res.setContent(msg.getContent());
        res.setIsLocked(msg.getIsLocked());
        res.setTimestamp(msg.getTimestamp());
        res.setStatus(status);
        return res;
    }
}
