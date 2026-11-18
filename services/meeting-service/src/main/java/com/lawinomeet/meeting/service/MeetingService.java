package com.lawinomeet.meeting.service;

import com.lawinomeet.meeting.dto.*;
import com.lawinomeet.meeting.entity.MeetingParticipant;
import com.lawinomeet.meeting.entity.MeetingRoom;
import com.lawinomeet.meeting.entity.RoomStatus;
import com.lawinomeet.meeting.exception.ApiException;
import com.lawinomeet.meeting.repository.MeetingParticipantRepository;
import com.lawinomeet.meeting.repository.MeetingRoomRepository;
import com.lawinomeet.meeting.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRoomRepository roomRepository;
    private final MeetingParticipantRepository participantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${webrtc.stun-server:stun:stun.l.google.com:19302}")
    private String stunServer;

    @Value("${webrtc.turn-server:}")
    private String turnServer;

    @Value("${webrtc.turn-username:}")
    private String turnUsername;

    @Value("${webrtc.turn-credential:}")
    private String turnCredential;

    @Transactional
    public MeetingRoomResponse createOrGetRoom(UserPrincipal principal, CreateRoomRequest request) {
        if (request.getConsultationType() != null &&
            ("CHAT".equalsIgnoreCase(request.getConsultationType()) ||
             "IN_PERSON".equalsIgnoreCase(request.getConsultationType()) ||
             "OFFLINE".equalsIgnoreCase(request.getConsultationType()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "VIDEO_NOT_PERMITTED",
                    "Video consultation room cannot be launched for " + request.getConsultationType() + " appointments.");
        }

        Optional<MeetingRoom> existing = roomRepository.findByAppointmentPublicId(request.getAppointmentPublicId());
        if (existing.isPresent()) {
            MeetingRoom room = existing.get();
            validateParticipantOrAdmin(room, principal);
            return MeetingRoomResponse.fromEntity(room, getIceServers());
        }

        // 1:1 Consultation Meeting Room
        MeetingRoom room = MeetingRoom.builder()
                .publicId(UUID.randomUUID().toString())
                .appointmentPublicId(request.getAppointmentPublicId())
                .clientUserPublicId(request.getClientUserPublicId())
                .clientUsername(request.getClientUsername())
                .lawyerUserPublicId(request.getLawyerUserPublicId())
                .lawyerUsername(request.getLawyerUsername())
                .roomStatus(RoomStatus.WAITING)
                .roomToken(UUID.randomUUID().toString().replace("-", ""))
                .build();

        MeetingRoom saved = roomRepository.save(room);
        log.info("Initialized 1:1 consultation meeting room {} for appointment {}",
                saved.getPublicId(), saved.getAppointmentPublicId());

        return MeetingRoomResponse.fromEntity(saved, getIceServers());
    }

    @Transactional(readOnly = true)
    public MeetingRoomResponse getRoom(UserPrincipal principal, String roomPublicId) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);
        return MeetingRoomResponse.fromEntity(room, getIceServers());
    }

    @Transactional(readOnly = true)
    public MeetingRoomResponse getRoomByAppointment(UserPrincipal principal, String appointmentPublicId) {
        MeetingRoom room = roomRepository.findByAppointmentPublicId(appointmentPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND",
                        "No meeting room found for this appointment."));
        validateParticipantOrAdmin(room, principal);
        return MeetingRoomResponse.fromEntity(room, getIceServers());
    }

    @Transactional
    public JoinRoomResponse joinRoom(UserPrincipal principal, String roomPublicId) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);

        if (room.getRoomStatus() == RoomStatus.ENDED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROOM_ENDED",
                    "This consultation meeting has already ended.");
        }

        String role = principal.getPublicId().equals(room.getLawyerUserPublicId()) ? "HOST" : "CLIENT";
        Instant now = Instant.now();

        MeetingParticipant participant = MeetingParticipant.builder()
                .publicId(UUID.randomUUID().toString())
                .meetingRoom(room)
                .userPublicId(principal.getPublicId())
                .username(principal.getUsername())
                .role(role)
                .joinedAt(now)
                .build();
        participantRepository.save(participant);

        // Transition room to ACTIVE when both counsel and client have joined
        List<MeetingParticipant> participants = participantRepository.findByMeetingRoomId(room.getId());
        boolean hasHost = participants.stream().anyMatch(p -> "HOST".equals(p.getRole()));
        boolean hasClient = participants.stream().anyMatch(p -> "CLIENT".equals(p.getRole()));

        if (hasHost && hasClient && room.getRoomStatus() == RoomStatus.WAITING) {
            room.setRoomStatus(RoomStatus.ACTIVE);
            if (room.getStartedAt() == null) {
                room.setStartedAt(now);
            }
            room = roomRepository.save(room);
            log.info("Counsel and client joined. 1:1 Meeting room {} is now ACTIVE", roomPublicId);
        }

        // Notify room subscribers via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + room.getPublicId(),
                    SignalingPayload.builder()
                            .type("USER_JOINED")
                            .senderUserPublicId(principal.getPublicId())
                            .data(room.getRoomStatus().name())
                            .build());
        } catch (Exception e) {
            log.warn("Signaling dispatch failed: {}", e.getMessage());
        }

        return JoinRoomResponse.builder()
                .roomPublicId(room.getPublicId())
                .userPublicId(principal.getPublicId())
                .roomStatus(room.getRoomStatus())
                .joinedAt(now)
                .iceServers(getIceServers())
                .build();
    }

    @Transactional
    public void leaveRoom(UserPrincipal principal, String roomPublicId) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);

        participantRepository.findTopByMeetingRoomIdAndUserPublicIdOrderByJoinedAtDesc(room.getId(), principal.getPublicId())
                .ifPresent(p -> {
                    p.setLeftAt(Instant.now());
                    participantRepository.save(p);
                });

        log.info("User {} left meeting room {}", principal.getUsername(), roomPublicId);

        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + room.getPublicId(),
                    SignalingPayload.builder()
                            .type("USER_LEFT")
                            .senderUserPublicId(principal.getPublicId())
                            .data("LEFT")
                            .build());
        } catch (Exception e) {
            log.warn("Signaling leave dispatch failed: {}", e.getMessage());
        }
    }

    @Transactional
    public MeetingRoomResponse endRoom(UserPrincipal principal, String roomPublicId) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);

        boolean isHost = principal.getPublicId().equals(room.getLawyerUserPublicId());
        boolean isAdmin = "PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "FIRM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "ROLE_FIRM_ADMIN".equalsIgnoreCase(principal.getRole());

        if (!isHost && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only the presiding advocate or platform administrator can end this consultation.");
        }

        Instant now = Instant.now();
        room.setRoomStatus(RoomStatus.ENDED);
        room.setEndedAt(now);

        if (room.getStartedAt() != null) {
            room.setDurationSeconds(Duration.between(room.getStartedAt(), now).getSeconds());
        }

        MeetingRoom saved = roomRepository.save(room);
        log.info("Meeting room {} ended by counsel/admin {}. Duration: {}s",
                roomPublicId, principal.getUsername(), saved.getDurationSeconds());

        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + room.getPublicId(),
                    SignalingPayload.builder()
                            .type("ROOM_ENDED")
                            .senderUserPublicId(principal.getPublicId())
                            .data("COMPLETED")
                            .build());
        } catch (Exception e) {
            log.warn("Signaling end dispatch failed: {}", e.getMessage());
        }

        return MeetingRoomResponse.fromEntity(saved, getIceServers());
    }

    public void relaySignal(UserPrincipal principal, String roomPublicId, SignalingPayload payload) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);

        payload.setSenderUserPublicId(principal.getPublicId());
        messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId, payload);
    }

    public List<IceServerConfig> getIceServers() {
        List<IceServerConfig> configs = new ArrayList<>();
        if (StringUtils.hasText(stunServer)) {
            configs.add(IceServerConfig.builder().urls(List.of(stunServer)).build());
        }
        if (StringUtils.hasText(turnServer)) {
            IceServerConfig.IceServerConfigBuilder turnBuilder = IceServerConfig.builder()
                    .urls(List.of(turnServer));
            if (StringUtils.hasText(turnUsername)) {
                turnBuilder.username(turnUsername);
            }
            if (StringUtils.hasText(turnCredential)) {
                turnBuilder.credential(turnCredential);
            }
            configs.add(turnBuilder.build());
        }
        if (configs.isEmpty()) {
            configs.add(IceServerConfig.builder().urls(List.of("stun:stun.l.google.com:19302")).build());
        }
        return configs;
    }

    private MeetingRoom getRoomOrThrow(String roomPublicId) {
        return roomRepository.findByPublicId(roomPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND",
                        "Meeting room not found with public ID: " + roomPublicId));
    }

    private void validateParticipantOrAdmin(MeetingRoom room, UserPrincipal principal) {
        boolean isDirect = room.isAuthorizedParticipant(principal.getPublicId());
        boolean isAdmin = "PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "FIRM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                          "ROLE_FIRM_ADMIN".equalsIgnoreCase(principal.getRole());

        if (isDirect || isAdmin) {
            return;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "You are not an authorized participant in this 1:1 consultation meeting.");
    }
}
