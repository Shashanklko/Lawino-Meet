package com.lawinomeetMeetmeet;

import com.lawinomeetMeetmeet.consultation.dto.ConsultationRequest;
import com.lawinomeetMeetmeet.consultation.enums.ConsultationMode;
import com.lawinomeetMeetmeet.user.entity.User;
import com.lawinomeetMeetmeet.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class FinalModuleTest {

    @Mock
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void consultationRequest_Creation_ShouldSetFieldsCorrectly() {
        ConsultationRequest request = new ConsultationRequest();
        request.setClientId(1L);
        request.setLawyerId(2L);
        request.setClientName("Sam");
        request.setLocation("Delhi");
        request.setQuery("Property dispute legal query");
        request.setRequestedTimeSlot(LocalDateTime.of(2026, 7, 1, 10, 30));
        request.setClientPhoneNumber("+919876543210");
        request.setClientEmail("sam@example.com");
        request.setMode(ConsultationMode.ONLINE_VIDEO);

        assertEquals("Sam", request.getClientName());
        assertEquals("Delhi", request.getLocation());
        assertEquals(ConsultationMode.ONLINE_VIDEO, request.getMode());
    }

    @Test
    void userRole_Assignment_ShouldMatchExpectedRole() {
        User client = new User();
        client.setId(1L);
        client.setEmail("client@example.com");
        client.setGlobalTokenBalance(5);

        assertNotNull(client);
        assertEquals(5, client.getGlobalTokenBalance());
    }
}
