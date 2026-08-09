package com.lawinomeet.chat.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.lawinomeet.chat.dto.ChatMessageResponse;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.dto.StartChatRequest;
import com.lawinomeet.chat.enums.ChatStatus;
import com.lawinomeet.chat.model.ChatMessage;
import com.lawinomeet.chat.model.ChatSession;
import com.lawinomeet.chat.repository.ChatMessageRepository;
import com.lawinomeet.chat.repository.ChatSessionRepository;
import com.lawinomeet.common.exception.ResourceNotFoundException;
import com.lawinomeet.common.service.AuditLogService;
import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeet.user.repository.UserRepository;

@Service
public class ChatServiceImp implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImp.class);

    @Autowired
    private ChatSessionRepository chatSessionRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    @Autowired 
    private UserRepository userRepository;
    @Autowired 
    private ProfessionalProfileRepository professionalProfileRepository;
    @Autowired
    private AuditLogService auditLogService;

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

    @Override
    @NonNull
    public ChatMessageResponse sendMessage(@NonNull SendMessageRequest request) {
        String sId = request.getChatSessionId();
        if (sId == null) throw new RuntimeException("Session ID missing");

        ChatSession session = chatSessionRepository.findById(sId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));

        String content = request.getContent();

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
            com.lawinomeet.user.entity.User user = userRepository.findById(senderUserId)
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
        Long profId = session.getProfessionalId();
        if (senderUserId != null && senderUserId.equals(profId)) {
            Integer granted = session.getTokensGranted() != null ? session.getTokensGranted() : 0;
            Integer consumed = session.getTokensConsumed() != null ? session.getTokensConsumed() : 0;
            
            if (granted <= consumed) {
                message.setIsLocked(true);
                session.setStatus(ChatStatus.LOCKED);
                log.info("[CHAT] Lawyer reply is LOCKED because user balance/grant is zero.");
            } else {
                message.setIsLocked(false);
                session.setStatus(ChatStatus.ACTIVE);
            }
        }

        session.setLastUpdateAt(LocalDateTime.now());
        chatSessionRepository.save(session);
        ChatMessage savedMsg = chatMessageRepository.save(message);

        return mapToResponse(savedMsg, session.getStatus());
    }

    @Override
    @NonNull
    public List<ChatMessageResponse> getMessagesBySessionId(@NonNull String chatSessionId) {
        ChatSession session = chatSessionRepository.findById(chatSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));
        
        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByTimestampAsc(chatSessionId);
        return messages.stream()
                .map(msg -> mapToResponse(msg, session.getStatus()))
                .collect(Collectors.toList());
    }

    @Override
    @NonNull
    public List<ChatMessageResponse> getChatHistory(@NonNull String chatSessionId) {
        return getMessagesBySessionId(chatSessionId);
    }

    @Override
    @NonNull
    public ChatSession getSessionById(@NonNull String sessionId) {
        return chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));
    }

    @Override
    public ChatSession unlockReply(@NonNull String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));
        
        com.lawinomeet.user.entity.User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        com.lawinomeet.user.entity.ProfessionalProfile prof = professionalProfileRepository.findByUserId(session.getProfessionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Professional Profile not found"));

        Double fee = prof.getChatUnlockFee() != null ? prof.getChatUnlockFee() : 99.0;
        
        // Add 1 reply token to session
        Integer granted = session.getTokensGranted() != null ? session.getTokensGranted() : 0;
        session.setTokensGranted(granted + 1);
        session.setStatus(ChatStatus.ACTIVE);
        
        // Unlock any locked messages in this session
        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByTimestampAsc(sessionId);
        for (ChatMessage msg : messages) {
            if (Boolean.TRUE.equals(msg.getIsLocked())) {
                msg.setIsLocked(false);
                chatMessageRepository.save(msg);
            }
        }
        
        log.info("[CHAT UNLOCK] Session {} unlocked with fee {}. Granted Token Count: {}", sessionId, fee, session.getTokensGranted());
        return chatSessionRepository.save(session);
    }

    @Override
    public ChatSession endSessionByProfessional(@NonNull String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));
        
        session.setProfessionalEndedChat(true);
        session.setStatus(ChatStatus.CLOSED);
        session.setLastUpdateAt(LocalDateTime.now());
        log.info("[CHAT] Session {} ENDED by Professional", sessionId);
        return chatSessionRepository.save(session);
    }

    @Override
    public void endChatByUser(@NonNull String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat Session not found"));
        session.setStatus(ChatStatus.CLOSED);
        session.setLastUpdateAt(LocalDateTime.now());
        chatSessionRepository.save(session);
    }

    @Override
    public void endChatByProfessional(@NonNull String sessionId) {
        endSessionByProfessional(sessionId);
    }

    @Override
    public List<ChatSession> getUserSessions(@NonNull Long userId) {
        return chatSessionRepository.findByUserId(userId);
    }

    @Override
    public List<ChatSession> getProfessionalSessions(@NonNull Long professionalId) {
        return chatSessionRepository.findByProfessionalId(professionalId);
    }

    private ChatMessageResponse mapToResponse(ChatMessage msg, ChatStatus sessionStatus) {
        ChatMessageResponse res = new ChatMessageResponse();
        res.setId(msg.getId());
        res.setChatSessionId(msg.getChatSessionId());
        res.setSenderId(msg.getSenderId());
        res.setReceiverId(msg.getReceiverId());
        res.setType(msg.getType());
        res.setIsLocked(msg.getIsLocked());
        res.setTimestamp(msg.getTimestamp());
        res.setStatus(sessionStatus);

        if (Boolean.TRUE.equals(msg.getIsLocked())) {
            res.setContent("🔒 [Message Locked - Please unlock this reply to view professional response]");
        } else {
            res.setContent(msg.getContent());
        }
        return res;
    }
}
