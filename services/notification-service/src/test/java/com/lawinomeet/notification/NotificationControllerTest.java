package com.lawinomeet.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.notification.dto.CreateNotificationEventRequest;
import com.lawinomeet.notification.entity.NotificationType;
import com.lawinomeet.notification.repository.NotificationRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

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
        notificationRepository.deleteAll();
    }

    @Test
    void testDispatchEventAndRetrieveNotifications() throws Exception {
        String recipientId = UUID.randomUUID().toString();
        String userToken = createTestJwt(recipientId, "adv_verma", "LAWYER");

        CreateNotificationEventRequest eventReq = CreateNotificationEventRequest.builder()
                .recipientUserPublicId(recipientId)
                .recipientUsername("adv_verma")
                .notificationType(NotificationType.APPOINTMENT_REQUESTED)
                .title("New Consultation Requested")
                .message("Client Rahul Sharma has requested an online legal consultation.")
                .referenceType("APPOINTMENT")
                .referenceId("apt-12345")
                .build();

        // 1. Dispatch notification event (from internal event or appointment-service)
        mockMvc.perform(post("/api/notifications/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(eventReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.recipientUserPublicId", is(recipientId)))
                .andExpect(jsonPath("$.data.notificationType", is("APPOINTMENT_REQUESTED")))
                .andExpect(jsonPath("$.data.isRead", is(false)));

        // 2. Recipient views their notifications
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("New Consultation Requested")))
                .andExpect(jsonPath("$.data[0].referenceType", is("APPOINTMENT")));
    }

    @Test
    void testUnreadCountAndMarkAsRead() throws Exception {
        String recipientId = UUID.randomUUID().toString();
        String userToken = createTestJwt(recipientId, "anita_client", "CLIENT");

        // Dispatch 2 notifications
        CreateNotificationEventRequest event1 = CreateNotificationEventRequest.builder()
                .recipientUserPublicId(recipientId)
                .recipientUsername("anita_client")
                .notificationType(NotificationType.APPOINTMENT_ACCEPTED)
                .title("Appointment Confirmed")
                .message("Advocate Sharma has confirmed your consultation.")
                .referenceType("APPOINTMENT")
                .referenceId("apt-111")
                .build();

        CreateNotificationEventRequest event2 = CreateNotificationEventRequest.builder()
                .recipientUserPublicId(recipientId)
                .recipientUsername("anita_client")
                .notificationType(NotificationType.NEW_CHAT_MESSAGE)
                .title("New Message")
                .message("You received a message from Advocate Sharma.")
                .referenceType("CHAT")
                .referenceId("chat-222")
                .build();

        MvcResult res1 = mockMvc.perform(post("/api/notifications/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(event1)))
                .andExpect(status().isCreated())
                .andReturn();

        mockMvc.perform(post("/api/notifications/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(event2)))
                .andExpect(status().isCreated());

        String notif1PublicId = objectMapper.readTree(res1.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Check unread count is 2
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(2)));

        // Mark 1st notification as read
        mockMvc.perform(patch("/api/notifications/" + notif1PublicId + "/read")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead", is(true)))
                .andExpect(jsonPath("$.data.readAt", notNullValue()));

        // Check unread count is now 1
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(1)));

        // Mark all as read
        mockMvc.perform(patch("/api/notifications/mark-all-read")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedCount", is(1)));

        // Check unread count is now 0
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));
    }

    @Test
    void testUnauthorizedAccessAndDeletion() throws Exception {
        String userAId = UUID.randomUUID().toString();
        String userAToken = createTestJwt(userAId, "user_a", "CLIENT");

        String userBId = UUID.randomUUID().toString();
        String userBToken = createTestJwt(userBId, "user_b", "CLIENT");

        CreateNotificationEventRequest event = CreateNotificationEventRequest.builder()
                .recipientUserPublicId(userAId)
                .notificationType(NotificationType.SYSTEM_ALERT)
                .title("System Maintenance")
                .message("Platform scheduled maintenance on Sunday.")
                .build();

        MvcResult res = mockMvc.perform(post("/api/notifications/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(event)))
                .andExpect(status().isCreated())
                .andReturn();

        String notifPublicId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // User B attempts to mark User A's notification as read -> 403 Forbidden
        mockMvc.perform(patch("/api/notifications/" + notifPublicId + "/read")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));

        // User B attempts to delete User A's notification -> 403 Forbidden
        mockMvc.perform(delete("/api/notifications/" + notifPublicId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));

        // User A deletes their own notification -> 200 OK
        mockMvc.perform(delete("/api/notifications/" + notifPublicId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk());

        // List is now empty for User A
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}
