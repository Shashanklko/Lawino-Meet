package com.lawinomeet.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.user.dto.*;
import com.lawinomeet.user.entity.FirmRole;
import com.lawinomeet.user.entity.LawyerProfile;
import com.lawinomeet.user.entity.ProfileStatus;
import com.lawinomeet.user.entity.VerificationStatus;
import com.lawinomeet.user.repository.ClientProfileRepository;
import com.lawinomeet.user.repository.FirmMemberRepository;
import com.lawinomeet.user.repository.LawFirmRepository;
import com.lawinomeet.user.repository.LawyerProfileRepository;
import com.lawinomeet.user.security.JwtTokenValidator;
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
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClientProfileRepository clientProfileRepository;

    @Autowired
    private LawyerProfileRepository lawyerProfileRepository;

    @Autowired
    private LawFirmRepository lawFirmRepository;

    @Autowired
    private FirmMemberRepository firmMemberRepository;

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
        firmMemberRepository.deleteAll();
        lawFirmRepository.deleteAll();
        lawyerProfileRepository.deleteAll();
        clientProfileRepository.deleteAll();
    }

    @Test
    void testClientProfileGetAndPut() throws Exception {
        String clientPublicId = UUID.randomUUID().toString();
        String token = createTestJwt(clientPublicId, "client_john", "CLIENT");

        // 1. Initial GET lazy creation
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("client_john")));

        // 2. PUT update
        UpdateClientProfileRequest updateReq = UpdateClientProfileRequest.builder()
                .fullName("John Doe Esq")
                .city("Mumbai")
                .state("Maharashtra")
                .phone("9876543210")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("John Doe Esq")))
                .andExpect(jsonPath("$.data.city", is("Mumbai")));
    }

    @Test
    void testLawyerProfileUpdateAndMessagingToggle() throws Exception {
        String lawyerPublicId = UUID.randomUUID().toString();
        String token = createTestJwt(lawyerPublicId, "adv_verma", "LAWYER");

        UpdateLawyerProfileRequest updateReq = UpdateLawyerProfileRequest.builder()
                .fullName("Advocate Verma")
                .qualification("LL.B, LL.M (Harvard)")
                .experienceYears(12)
                .city("Delhi")
                .state("Delhi")
                .biography("Experienced commercial and corporate litigator.")
                .messagingEnabled(true)
                .build();

        mockMvc.perform(put("/api/lawyers/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Advocate Verma")))
                .andExpect(jsonPath("$.data.experienceYears", is(12)));

        // Toggle messaging off
        mockMvc.perform(patch("/api/lawyers/messaging-setting?enabled=false")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messagingEnabled", is(false)));
    }

    @Test
    void testFirmCreationInvitationAndAcceptanceFlow() throws Exception {
        // 1. Create Firm by FIRM_ADMIN
        String firmAdminPublicId = UUID.randomUUID().toString();
        String firmAdminToken = createTestJwt(firmAdminPublicId, "firm_admin_raj", "FIRM_ADMIN");

        CreateLawFirmRequest firmReq = CreateLawFirmRequest.builder()
                .firmName("Apex Legal Advocates")
                .contactEmail("contact@apexlegal.com")
                .contactPhone("011-23456789")
                .city("Delhi")
                .state("Delhi")
                .description("Full service corporate law firm.")
                .build();

        MvcResult firmResult = mockMvc.perform(post("/api/firms")
                        .header("Authorization", "Bearer " + firmAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firmReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.firmName", is("Apex Legal Advocates")))
                .andReturn();

        String firmResponse = firmResult.getResponse().getContentAsString();
        String firmPublicId = objectMapper.readTree(firmResponse).path("data").path("publicId").asText();

        // 2. Pre-create a lawyer profile in user_db
        String lawyerPublicId = UUID.randomUUID().toString();
        String lawyerToken = createTestJwt(lawyerPublicId, "adv_rohit", "LAWYER");

        lawyerProfileRepository.save(LawyerProfile.builder()
                .userPublicId(lawyerPublicId)
                .username("adv_rohit")
                .slug("adv-rohit")
                .fullName("Rohit Sharma")
                .city("Delhi")
                .verificationStatus(VerificationStatus.VERIFIED)
                .publicProfileStatus(ProfileStatus.PUBLISHED)
                .build());

        // 3. Firm Admin invites the lawyer
        InviteMemberRequest inviteReq = InviteMemberRequest.builder()
                .lawyerUsername("adv_rohit")
                .roleInFirm(FirmRole.PARTNER)
                .build();

        MvcResult inviteResult = mockMvc.perform(post("/api/firms/" + firmPublicId + "/members/invitations")
                        .header("Authorization", "Bearer " + firmAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inviteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.membershipStatus", is("INVITED")))
                .andReturn();

        long invitationId = objectMapper.readTree(inviteResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 4. Lawyer accepts the invitation
        mockMvc.perform(patch("/api/firms/members/" + invitationId + "/accept")
                        .header("Authorization", "Bearer " + lawyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.membershipStatus", is("ACCEPTED")));

        // 5. Verify public lawyer profile reflects the firm association!
        mockMvc.perform(get("/api/lawyers/adv-rohit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.associatedFirmName", is("Apex Legal Advocates")));
    }

    @Test
    void testSearchLawyersAndFirms() throws Exception {
        lawyerProfileRepository.save(LawyerProfile.builder()
                .userPublicId(UUID.randomUUID().toString())
                .username("adv_arun")
                .slug("adv-arun")
                .fullName("Arun Jaitley Legal")
                .city("Delhi")
                .experienceYears(15)
                .biography("Specialist in commercial litigation")
                .verificationStatus(VerificationStatus.VERIFIED)
                .publicProfileStatus(ProfileStatus.PUBLISHED)
                .build());

        mockMvc.perform(get("/api/search/lawyers?query=commercial&city=Delhi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].username", is("adv_arun")));
    }

    @Test
    void testSpecializationsSeedAvailable() throws Exception {
        mockMvc.perform(get("/api/specializations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(5))));
    }
}
