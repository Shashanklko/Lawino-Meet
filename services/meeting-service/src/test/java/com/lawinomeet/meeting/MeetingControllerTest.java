package com.lawinomeet.meeting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.meeting.dto.CreateRoomRequest;
import com.lawinomeet.meeting.dto.SignalingPayload;
import com.lawinomeet.meeting.entity.RoomStatus;
import com.lawinomeet.meeting.repository.MeetingParticipantRepository;
import com.lawinomeet.meeting.repository.MeetingRoomRepository;
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
class MeetingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MeetingRoomRepository roomRepository;

    @Autowired
    private MeetingParticipantRepository participantRepository;

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
        participantRepository.deleteAll();
        roomRepository.deleteAll();
    }

    @Test
    void testCreateRoomAndGetDetails() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "rohit_client", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_singh", "LAWYER");

        String appointmentId = UUID.randomUUID().toString();

        CreateRoomRequest request = CreateRoomRequest.builder()
                .appointmentPublicId(appointmentId)
                .clientUserPublicId(clientId)
                .clientUsername("rohit_client")
                .lawyerUserPublicId(lawyerId)
                .lawyerUsername("adv_singh")
                .build();

        // 1. Initialize meeting room
        MvcResult res = mockMvc.perform(post("/api/meetings/rooms")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.appointmentPublicId", is(appointmentId)))
                .andExpect(jsonPath("$.data.roomStatus", is("WAITING")))
                .andExpect(jsonPath("$.data.iceServers", not(empty())))
                .andReturn();

        String roomPublicId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // 2. Lawyer accesses room by appointment public ID
        mockMvc.perform(get("/api/meetings/appointments/" + appointmentId + "/room")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId", is(roomPublicId)))
                .andExpect(jsonPath("$.data.clientUsername", is("rohit_client")));

        // 3. Client retrieves room by room public ID
        mockMvc.perform(get("/api/meetings/rooms/" + roomPublicId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId", is(roomPublicId)));
    }

    @Test
    void testJoinRoomAndLifecycleTransitionToActive() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "neha_client", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_patel", "LAWYER");

        String appointmentId = UUID.randomUUID().toString();

        CreateRoomRequest request = CreateRoomRequest.builder()
                .appointmentPublicId(appointmentId)
                .clientUserPublicId(clientId)
                .clientUsername("neha_client")
                .lawyerUserPublicId(lawyerId)
                .lawyerUsername("adv_patel")
                .build();

        MvcResult res = mockMvc.perform(post("/api/meetings/rooms")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String roomPublicId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // 1. Client joins -> Status is still WAITING (waiting for lawyer)
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roomStatus", is("WAITING")));

        // 2. Lawyer joins -> Both participants present -> Status transitions to ACTIVE
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roomStatus", is("ACTIVE")));

        // Verify room in DB is ACTIVE
        assertThat(roomRepository.findByPublicId(roomPublicId).orElseThrow().getRoomStatus())
                .isEqualTo(RoomStatus.ACTIVE);
    }

    @Test
    void testLeaveAndEndRoomLifecycle() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "priya_client", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_roy", "LAWYER");

        CreateRoomRequest request = CreateRoomRequest.builder()
                .appointmentPublicId(UUID.randomUUID().toString())
                .clientUserPublicId(clientId)
                .lawyerUserPublicId(lawyerId)
                .build();

        MvcResult res = mockMvc.perform(post("/api/meetings/rooms")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String roomPublicId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Both join
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk());

        // Client leaves
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/leave")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk());

        // Lawyer ends room
        mockMvc.perform(patch("/api/meetings/rooms/" + roomPublicId + "/end")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roomStatus", is("ENDED")))
                .andExpect(jsonPath("$.data.endedAt", notNullValue()));

        // Trying to join after ENDED returns 400 Bad Request
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("ROOM_ENDED")));
    }

    @Test
    void testUnauthorizedUserAccessAndSignaling() throws Exception {
        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "client_a", "CLIENT");

        String lawyerId = UUID.randomUUID().toString();

        String intruderId = UUID.randomUUID().toString();
        String intruderToken = createTestJwt(intruderId, "intruder_user", "CLIENT");

        CreateRoomRequest request = CreateRoomRequest.builder()
                .appointmentPublicId(UUID.randomUUID().toString())
                .clientUserPublicId(clientId)
                .lawyerUserPublicId(lawyerId)
                .build();

        MvcResult res = mockMvc.perform(post("/api/meetings/rooms")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String roomPublicId = objectMapper.readTree(res.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Intruder tries to get room details -> 403 Forbidden
        mockMvc.perform(get("/api/meetings/rooms/" + roomPublicId)
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));

        // Intruder tries to join room -> 403 Forbidden
        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/join")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));

        // Authorized client relays WebRTC SDP Offer -> 200 OK
        SignalingPayload offer = SignalingPayload.builder()
                .type("OFFER")
                .targetUserPublicId(lawyerId)
                .data("v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n")
                .build();

        mockMvc.perform(post("/api/meetings/rooms/" + roomPublicId + "/signal")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offer)))
                .andExpect(status().isOk());
    }
}
