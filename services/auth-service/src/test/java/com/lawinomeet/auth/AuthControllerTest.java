package com.lawinomeet.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawinomeet.auth.dto.LoginRequest;
import com.lawinomeet.auth.dto.RegisterRequest;
import com.lawinomeet.auth.entity.AccountStatus;
import com.lawinomeet.auth.entity.Role;
import com.lawinomeet.auth.entity.User;
import com.lawinomeet.auth.repository.UserRepository;
import com.lawinomeet.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void resetDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void testClientRegistration() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("client_john")
                .email("john@lawino.com")
                .password("StrongPass123!")
                .fullName("John Doe")
                .build();

        mockMvc.perform(post("/api/auth/register/client")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.username", is("client_john")))
                .andExpect(jsonPath("$.data.user.email", is("john@lawino.com")))
                .andExpect(jsonPath("$.data.user.role", is("CLIENT")));
    }

    @Test
    void testLawyerRegistration() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("adv_sharma")
                .email("sharma@lawino.com")
                .password("AdvocatePass99#")
                .fullName("Advocate Sharma")
                .build();

        mockMvc.perform(post("/api/auth/register/lawyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.role", is("LAWYER")));
    }

    @Test
    void testDuplicateUsernameConflict() throws Exception {
        userRepository.save(User.builder()
                .publicId(UUID.randomUUID().toString())
                .username("testuser_unique")
                .email("existing@lawino.com")
                .passwordHash(passwordEncoder.encode("ExistingPass1!"))
                .role(Role.CLIENT)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        RegisterRequest duplicateUser = RegisterRequest.builder()
                .username("testuser_unique")
                .email("new@lawino.com")
                .password("AnotherStrong1!")
                .build();

        mockMvc.perform(post("/api/auth/register/client")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateUser)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("USERNAME_ALREADY_EXISTS")));
    }

    @Test
    void testLoginWithUsernameAndEmail() throws Exception {
        userRepository.save(User.builder()
                .publicId(UUID.randomUUID().toString())
                .username("login_member")
                .email("member@lawino.com")
                .passwordHash(passwordEncoder.encode("ValidSecret88$"))
                .role(Role.CLIENT)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        // Login using email
        LoginRequest loginByEmail = LoginRequest.builder()
                .identifier("member@lawino.com")
                .password("ValidSecret88$")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginByEmail)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.username", is("login_member")));

        // Login using username
        LoginRequest loginByUsername = LoginRequest.builder()
                .identifier("login_member")
                .password("ValidSecret88$")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginByUsername)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }

    @Test
    void testLoginFailureOnWrongPassword() throws Exception {
        userRepository.save(User.builder()
                .publicId(UUID.randomUUID().toString())
                .username("secure_user")
                .email("secure@lawino.com")
                .passwordHash(passwordEncoder.encode("RealSecret12#"))
                .role(Role.CLIENT)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        LoginRequest wrongPass = LoginRequest.builder()
                .identifier("secure_user")
                .password("WrongSecret00#")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPass)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("INVALID_CREDENTIALS")));
    }

    @Test
    void testMeEndpointWithValidToken() throws Exception {
        User user = userRepository.save(User.builder()
                .publicId(UUID.randomUUID().toString())
                .username("me_lawyer")
                .email("me@lawino.com")
                .passwordHash(passwordEncoder.encode("PassMe123!"))
                .role(Role.LAWYER)
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        String jwt = tokenProvider.generateAccessToken(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("me_lawyer")))
                .andExpect(jsonPath("$.data.publicId", is(user.getPublicId())))
                .andExpect(jsonPath("$.data.role", is("LAWYER")));
    }

    @Test
    void testMeEndpointWithoutTokenFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
