package com.lawinomeet.appointment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.appointment.dto.*;
import com.lawinomeet.appointment.entity.Appointment;
import com.lawinomeet.appointment.entity.AppointmentStatus;
import com.lawinomeet.appointment.entity.ConsultationType;
import com.lawinomeet.appointment.entity.SlotStatus;
import com.lawinomeet.appointment.repository.AppointmentRepository;
import com.lawinomeet.appointment.repository.AvailabilitySlotRepository;
import com.lawinomeet.appointment.service.AppointmentService;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AvailabilitySlotRepository slotRepository;

    @Autowired
    private AppointmentService appointmentService;

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
        appointmentRepository.deleteAll();
        slotRepository.deleteAll();
    }

    @Test
    void testCreateAndQueryAvailabilitySlots() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_sharma", "LAWYER");

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        Instant end = start.plus(30, ChronoUnit.MINUTES);

        CreateSlotRequest createReq = CreateSlotRequest.builder()
                .startTime(start)
                .endTime(end)
                .build();

        // 1. Lawyer creates availability slot
        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.lawyerUserPublicId", is(lawyerId)))
                .andExpect(jsonPath("$.data.slotStatus", is("AVAILABLE")));

        // 2. Public view of available slots for lawyer
        mockMvc.perform(get("/api/lawyers/" + lawyerId + "/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].slotStatus", is("AVAILABLE")));

        // 3. Lawyer views their own slots
        mockMvc.perform(get("/api/availability/my")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void testBatchCreateAndDeleteAvailabilitySlot() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_verma", "LAWYER");

        Instant base = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        CreateSlotRequest slot1 = CreateSlotRequest.builder().startTime(base).endTime(base.plus(30, ChronoUnit.MINUTES)).build();
        CreateSlotRequest slot2 = CreateSlotRequest.builder().startTime(base.plus(35, ChronoUnit.MINUTES)).endTime(base.plus(65, ChronoUnit.MINUTES)).build();

        BatchCreateSlotsRequest batchReq = BatchCreateSlotsRequest.builder()
                .slots(List.of(slot1, slot2))
                .build();

        MvcResult result = mockMvc.perform(post("/api/availability/batch")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andReturn();

        String slot1PublicId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data").get(0).get("publicId").asText();

        // Lawyer deletes slot 1
        mockMvc.perform(delete("/api/availability/" + slot1PublicId)
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Slot 1 is gone, slot 2 remains
        mockMvc.perform(get("/api/lawyers/" + lawyerId + "/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void testBookAppointmentAndDoubleBookingAtomicPrevention() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_mehta", "LAWYER");

        String client1Id = UUID.randomUUID().toString();
        String client1Token = createTestJwt(client1Id, "rahul_client", "CLIENT");

        String client2Id = UUID.randomUUID().toString();
        String client2Token = createTestJwt(client2Id, "anita_client", "CLIENT");

        // Lawyer creates slot
        Instant start = Instant.now().plus(4, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        Instant end = start.plus(45, ChronoUnit.MINUTES);

        CreateSlotRequest slotReq = CreateSlotRequest.builder().startTime(start).endTime(end).build();
        MvcResult slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slotReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String slotPublicId = objectMapper.readTree(slotRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Client 1 books the slot
        CreateAppointmentRequest bookReq = CreateAppointmentRequest.builder()
                .slotPublicId(slotPublicId)
                .consultationType(ConsultationType.ONLINE)
                .consultationReason("Corporate contract review and arbitration advice.")
                .build();

        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + client1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.appointmentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.clientUsername", is("rahul_client")));

        // Client 2 attempts to book the SAME slot -> HTTP 409 Conflict
        mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + client2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode", is("SLOT_NOT_AVAILABLE")));
    }

    @Test
    void testLawyerAcceptsAppointmentAndCompletes() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_singh", "LAWYER");

        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "vikram_client", "CLIENT");

        // Create slot & book
        Instant start = Instant.now().plus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        CreateSlotRequest slotReq = CreateSlotRequest.builder().startTime(start).endTime(start.plus(30, ChronoUnit.MINUTES)).build();
        MvcResult slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slotReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String slotPublicId = objectMapper.readTree(slotRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        CreateAppointmentRequest bookReq = CreateAppointmentRequest.builder()
                .slotPublicId(slotPublicId)
                .consultationType(ConsultationType.ONLINE)
                .consultationReason("Property dispute consultation")
                .build();

        MvcResult aptRes = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String appointmentPublicId = objectMapper.readTree(aptRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Lawyer accepts appointment -> transitions to AWAITING_PAYMENT
        mockMvc.perform(patch("/api/appointments/" + appointmentPublicId + "/accept")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("AWAITING_PAYMENT")))
                .andExpect(jsonPath("$.data.acceptedAt", notNullValue()));

        // Client pays retainer -> transitions to CONFIRMED
        mockMvc.perform(post("/api/appointments/" + appointmentPublicId + "/pay")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("CONFIRMED")))
                .andExpect(jsonPath("$.data.paidAt", notNullValue()));

        // Check slot is now BOOKED
        assertThat(slotRepository.findByPublicId(slotPublicId).orElseThrow().getSlotStatus())
                .isEqualTo(SlotStatus.BOOKED);

        // Lawyer completes appointment (requests completion)
        mockMvc.perform(patch("/api/appointments/" + appointmentPublicId + "/complete")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("COMPLETION_REQUESTED")))
                .andExpect(jsonPath("$.data.completionRequestedAt", notNullValue()));

        // Client confirms completion -> transitions to COMPLETED
        mockMvc.perform(patch("/api/appointments/" + appointmentPublicId + "/confirm")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("COMPLETED")))
                .andExpect(jsonPath("$.data.completedAt", notNullValue()));
    }

    @Test
    void testLawyerRejectsAppointmentReleasesSlot() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_roy", "LAWYER");

        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "priya_client", "CLIENT");

        Instant start = Instant.now().plus(6, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        CreateSlotRequest slotReq = CreateSlotRequest.builder().startTime(start).endTime(start.plus(30, ChronoUnit.MINUTES)).build();
        MvcResult slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slotReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String slotPublicId = objectMapper.readTree(slotRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        CreateAppointmentRequest bookReq = CreateAppointmentRequest.builder()
                .slotPublicId(slotPublicId)
                .consultationType(ConsultationType.ONLINE)
                .consultationReason("Tax dispute filing")
                .build();

        MvcResult aptRes = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String appointmentPublicId = objectMapper.readTree(aptRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Lawyer rejects appointment
        RejectAppointmentRequest rejectReq = RejectAppointmentRequest.builder()
                .reason("Unavailable due to High Court hearing conflict.")
                .build();

        mockMvc.perform(patch("/api/appointments/" + appointmentPublicId + "/reject")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("REJECTED")))
                .andExpect(jsonPath("$.data.rejectionReason", is("Unavailable due to High Court hearing conflict.")));

        // Slot is released back to AVAILABLE
        assertThat(slotRepository.findByPublicId(slotPublicId).orElseThrow().getSlotStatus())
                .isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void testClientCancelsAppointmentReleasesSlot() throws Exception {
        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_joshi", "LAWYER");

        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "rohan_client", "CLIENT");

        Instant start = Instant.now().plus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        CreateSlotRequest slotReq = CreateSlotRequest.builder().startTime(start).endTime(start.plus(30, ChronoUnit.MINUTES)).build();
        MvcResult slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slotReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String slotPublicId = objectMapper.readTree(slotRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        CreateAppointmentRequest bookReq = CreateAppointmentRequest.builder()
                .slotPublicId(slotPublicId)
                .consultationType(ConsultationType.IN_PERSON)
                .consultationReason("Will execution guidance")
                .build();

        MvcResult aptRes = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String appointmentPublicId = objectMapper.readTree(aptRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Client cancels
        CancelAppointmentRequest cancelReq = CancelAppointmentRequest.builder()
                .reason("Change of travel plans")
                .build();

        mockMvc.perform(patch("/api/appointments/" + appointmentPublicId + "/cancel")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentStatus", is("CANCELLED")));

        // Slot released back to AVAILABLE
        assertThat(slotRepository.findByPublicId(slotPublicId).orElseThrow().getSlotStatus())
                .isEqualTo(SlotStatus.AVAILABLE);
    }

    @Test
    void testFirmOversightAndSchedulerExpiration() throws Exception {
        String firmId = UUID.randomUUID().toString();
        String firmAdminToken = createTestJwt(UUID.randomUUID().toString(), "lex_admin", "FIRM_ADMIN");

        String lawyerId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerId, "adv_firm_associate", "LAWYER");

        String clientId = UUID.randomUUID().toString();
        String clientToken = createTestJwt(clientId, "corporate_client", "CLIENT");

        Instant start = Instant.now().plus(8, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        CreateSlotRequest slotReq = CreateSlotRequest.builder().startTime(start).endTime(start.plus(30, ChronoUnit.MINUTES)).build();
        MvcResult slotRes = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + lawyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slotReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String slotPublicId = objectMapper.readTree(slotRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // Client books with firm association
        CreateAppointmentRequest bookReq = CreateAppointmentRequest.builder()
                .slotPublicId(slotPublicId)
                .firmPublicId(firmId)
                .consultationType(ConsultationType.ONLINE)
                .consultationReason("Corporate M&A due diligence consultation")
                .build();

        MvcResult aptRes = mockMvc.perform(post("/api/appointments")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String appointmentPublicId = objectMapper.readTree(aptRes.getResponse().getContentAsString())
                .get("data").get("publicId").asText();

        // 1. Firm Admin accesses firm-level appointments
        mockMvc.perform(get("/api/appointments/firm/" + firmId)
                        .header("Authorization", "Bearer " + firmAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].firmPublicId", is(firmId)));

        // 2. Simulate Response Deadline Expiration
        Appointment apt = appointmentRepository.findByPublicId(appointmentPublicId).orElseThrow();
        apt.setResponseDeadline(Instant.now().minus(1, ChronoUnit.MINUTES));
        appointmentRepository.save(apt);

        // Run expiration job
        int expired = appointmentService.expirePendingAppointments();
        assertThat(expired).isGreaterThanOrEqualTo(1);

        Appointment expiredApt = appointmentRepository.findByPublicId(appointmentPublicId).orElseThrow();
        assertThat(expiredApt.getAppointmentStatus()).isEqualTo(AppointmentStatus.EXPIRED);
        assertThat(slotRepository.findByPublicId(slotPublicId).orElseThrow().getSlotStatus())
                .isEqualTo(SlotStatus.AVAILABLE);
    }
}
