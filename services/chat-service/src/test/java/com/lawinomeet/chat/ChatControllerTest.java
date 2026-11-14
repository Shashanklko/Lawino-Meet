package com.lawinomeet.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.chat.dto.SendMessageRequest;
import com.lawinomeet.chat.repository.ChatMessageRepository;
import com.lawinomeet.chat.repository.ConversationRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Value("${app.jwt.secret:super-secret-jwt-key-change-this-in-production-min-256-bits-length}")
    private String jwtSecret;

    private String createTestJwt(String publicId, String username, String role) {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Jwts.builder()
                .subject(username)
                .claim("publicId", publicId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(keyBytes))
                .compact();
    }

    @BeforeEach
    void cleanup() {
        chatMessageRepository.deleteAll();
        conversationRepository.deleteAll();
    }

    @Test
    void testSendMessageAndGetConversations() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "rahul_client", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_verma", "LAWYER");

        SendMessageRequest sendReq = SendMessageRequest.builder()
                .recipientUserPublicId(lawyerId)
                .recipientUsername("adv_verma")
                .content("Hello Advocate Verma, I need legal guidance regarding IPR registration.")
                .build();

        // 1. Client sends message to Lawyer
        MvcResult sendRes = mockMvc.perform(post("/api/chat/messages")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.senderUserPublicId", is(clientId)))
                .andExpect(jsonPath("$.data.recipientUserPublicId", is(lawyerId)))
                .andExpect(jsonPath("$.data.content", containsString("Hello Advocate Verma")))
                .andExpect(jsonPath("$.data.isRead", is(false)))
                .andReturn();

        String conversationPublicId = objectMapper.readTree(sendRes.getResponse().getContentAsString())
                .get("data").get("conversationPublicId").asText();

        // 2. Client checks conversation list
        mockMvc.perform(get("/api/chat/conversations")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].publicId", is(conversationPublicId)))
                .andExpect(jsonPath("$.data[0].otherParticipantPublicId", is(lawyerId)))
                .andExpect(jsonPath("$.data[0].otherParticipantUsername", is("adv_verma")))
                .andExpect(jsonPath("$.data[0].unreadMessagesCount", is(0)));

        // 3. Lawyer checks conversation list -> 1 unread message
        mockMvc.perform(get("/api/chat/conversations")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].otherParticipantPublicId", is(clientId)))
                .andExpect(jsonPath("$.data[0].unreadMessagesCount", is(1)));
    }

    @Test
    void testGetConversationMessagesAndReadFlow() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "priya_client", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_sharma", "LAWYER");

        // Client sends message 1
        SendMessageRequest msg1 = SendMessageRequest.builder()
                .recipientUserPublicId(lawyerId)
                .recipientUsername("adv_sharma")
                .content("Message 1: Could we review the employment agreement?")
                .build();

        MvcResult res1 = mockMvc.perform(post("/api/chat/messages")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msg1)))
                .andExpect(status().isCreated())
                .andReturn();

        String convId = objectMapper.readTree(res1.getResponse().getContentAsString())
                .get("data").get("conversationPublicId").asText();

        // Lawyer replies with message 2
        SendMessageRequest msg2 = SendMessageRequest.builder()
                .recipientUserPublicId(clientId)
                .recipientUsername("priya_client")
                .content("Message 2: Sure, please share the NDA as well.")
                .build();

        mockMvc.perform(post("/api/chat/messages")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msg2)))
                .andExpect(status().isCreated());

        // Client fetches conversation messages
        mockMvc.perform(get("/api/chat/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].content", containsString("Message 1")))
                .andExpect(jsonPath("$.data[1].content", containsString("Message 2")));

        // Client checks unread count -> 1 (message 2 from lawyer is unread for client)
        mockMvc.perform(get("/api/chat/unread-count")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUnreadCount", is(1)));

        // Client marks conversation as read
        mockMvc.perform(patch("/api/chat/conversations/" + convId + "/read")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.readCount", is(1)));

        // Client unread count is now 0
        mockMvc.perform(get("/api/chat/unread-count")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUnreadCount", is(0)));
    }

    @Test
    void testForbiddenAccessAndSelfMessaging() throws Exception {
        String userAId = UUID.randomUUID().toString();
        String userAToken = createTestJwt(userAId, "user_a", "CLIENT");

        String userBId = UUID.randomUUID().toString();
        String userBToken = createTestJwt(userBId, "user_b", "LAWYER");

        String userCId = UUID.randomUUID().toString();
        String userCToken = createTestJwt(userCId, "user_c_intruder", "CLIENT");

        // 1. User A tries to message self -> 400 Bad Request
        SendMessageRequest selfMsg = SendMessageRequest.builder()
                .recipientUserPublicId(userAId)
                .content("Self note")
                .build();

        mockMvc.perform(post("/api/chat/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfMsg)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("SELF_MESSAGING")));

        // 2. User A sends message to User B
        SendMessageRequest validMsg = SendMessageRequest.builder()
                .recipientUserPublicId(userBId)
                .recipientUsername("user_b")
                .content("Private consultation inquiry")
                .build();

        MvcResult res = mockMvc.perform(post("/api/chat/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validMsg)))
                .andExpect(status().isCreated())
                .andReturn();

        String convId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("conversationPublicId").asText();

        // 3. User C (unrelated third party) attempts to read conversation messages -> 403 Forbidden
        mockMvc.perform(get("/api/chat/conversations/" + convId + "/messages")
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));

        // 4. User C attempts to mark conversation as read -> 403 Forbidden
        mockMvc.perform(patch("/api/chat/conversations/" + convId + "/read")
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));
    }
}
