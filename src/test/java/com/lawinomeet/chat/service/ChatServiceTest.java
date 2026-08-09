package com.lawinomeet.chat.service;

import com.lawinomeet.chat.enums.ChatStatus;
import com.lawinomeet.chat.model.ChatSession;
import com.lawinomeet.chat.repository.ChatMessageRepository;
import com.lawinomeet.chat.repository.ChatSessionRepository;
import com.lawinomeet.user.entity.ProfessionalProfile;
import com.lawinomeet.user.entity.User;
import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeet.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChatServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfessionalProfileRepository professionalProfileRepository;

    @InjectMocks
    private ChatServiceImp chatService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void unlockReply_ShouldCreditLawyerAndSetStatusToActive() {
        String sessionId = "session123";
        Long userId = 100L;
        Long professionalUserId = 200L;

        ChatSession session = new ChatSession();
        session.setId(sessionId);
        session.setUserId(userId);
        session.setProfessionalId(professionalUserId);
        session.setStatus(ChatStatus.LOCKED_REPLY);

        User user = new User();
        user.setId(userId);

        User professionalUser = new User();
        professionalUser.setId(professionalUserId);

        ProfessionalProfile profile = new ProfessionalProfile();
        profile.setUser(professionalUser);
        profile.setWalletBalance(100.0);
        profile.setChatUnlockFee(100.0);

        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(professionalProfileRepository.findByUserId(professionalUserId)).thenReturn(Optional.of(profile));
        when(chatSessionRepository.save(any(ChatSession.class))).thenReturn(session);

        chatService.unlockReply(sessionId);

        assertEquals(ChatStatus.ACTIVE, session.getStatus());
        assertEquals(100.0, profile.getWalletBalance());
        verify(professionalProfileRepository, never()).save(profile);
    }
    @Test
    void sendMessage_FromUser_ShouldDeductTokens() {
        String sessionId = "session123";
        Long userId = 100L;
        
        ChatSession session = new ChatSession();
        session.setId(sessionId);
        session.setUserId(userId);
        
        User user = new User();
        user.setId(userId);
        user.setGlobalTokenBalance(10);
        
        com.lawinomeet.chat.dto.SendMessageRequest request = new com.lawinomeet.chat.dto.SendMessageRequest();
        request.setChatSessionId(sessionId);
        request.setSenderId(userId);
        request.setContent("Hello Lawyer");
        
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(chatMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        
        chatService.sendMessage(request);
        
        assertEquals(9, user.getGlobalTokenBalance());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void sendMessage_FromProfessional_FirstTime_ShouldLockMessage() {
        String sessionId = "session123";
        Long professionalId = 200L;
        
        ChatSession session = new ChatSession();
        session.setId(sessionId);
        session.setProfessionalId(professionalId);
        session.setStatus(ChatStatus.AWAITING_REPLY);
        
        com.lawinomeet.chat.dto.SendMessageRequest request = new com.lawinomeet.chat.dto.SendMessageRequest();
        request.setChatSessionId(sessionId);
        request.setSenderId(professionalId);
        request.setContent("I can help you");
        
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(chatMessageRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        
        com.lawinomeet.chat.dto.ChatMessageResponse response = chatService.sendMessage(request);
        
        assertTrue(response.getIsLocked());
        assertEquals(ChatStatus.LOCKED, session.getStatus());
    }

    @Test
    void sendMessage_WithBlockedContent_ShouldThrowException() {
        com.lawinomeet.chat.dto.SendMessageRequest request = new com.lawinomeet.chat.dto.SendMessageRequest();
        request.setChatSessionId("session123");
        request.setContent("Call me at 9876543210");
        
        ChatSession session = new ChatSession();
        when(chatSessionRepository.findById(anyString())).thenReturn(Optional.of(session));
        
        assertThrows(RuntimeException.class, () -> chatService.sendMessage(request));
    }
}
