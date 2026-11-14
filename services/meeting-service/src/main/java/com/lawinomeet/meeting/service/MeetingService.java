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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        Optional<MeetingRoom> existing = roomRepository.findByAppointmentPublicId(request.getAppointmentPublicId());
        if (existing.isPresent()) {
            MeetingRoom room = existing.get();
            validateParticipantOrAdmin(room, principal);
            return MeetingRoomResponse.fromEntity(room, getIceServers());
        }

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
        log.info("Initialized consultation meeting room {} for appointment {}",
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

        String role = principal.getPublicId().equals(room.getClientUserPublicId()) ? "CLIENT" : "LAWYER";
        Instant now = Instant.now();

        MeetingParticipant participant = MeetingParticipant.builder()
                .meetingRoom(room)
                .userPublicId(principal.getPublicId())
                .username(principal.getUsername())
                .role(role)
                .joinedAt(now)
                .build();
        participantRepository.save(participant);

        // Check if both client and lawyer have joined to transition to ACTIVE
        List<MeetingParticipant> participants = participantRepository.findByMeetingRoomId(room.getId());
        boolean hasClient = participants.stream().anyMatch(p -> "CLIENT".equals(p.getRole()));
        boolean hasLawyer = participants.stream().anyMatch(p -> "LAWYER".equals(p.getRole()));

        if (hasClient && hasLawyer && room.getRoomStatus() == RoomStatus.WAITING) {
            room.setRoomStatus(RoomStatus.ACTIVE);
            room.setStartedAt(now);
            room = roomRepository.save(room);
            log.info("Both participants joined. Meeting room {} is now ACTIVE", roomPublicId);
        }

        // Notify room subscribers via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId,
                    SignalingPayload.builder()
                            .type("JOIN")
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

        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId,
                    SignalingPayload.builder()
                            .type("LEAVE")
                            .senderUserPublicId(principal.getPublicId())
                            .build());
        } catch (Exception e) {
            log.warn("Signaling dispatch failed: {}", e.getMessage());
        }
    }

    @Transactional
    public MeetingRoomResponse endRoom(UserPrincipal principal, String roomPublicId) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);

        if (room.getRoomStatus() != RoomStatus.ENDED) {
            Instant now = Instant.now();
            room.setRoomStatus(RoomStatus.ENDED);
            room.setEndedAt(now);
            if (room.getStartedAt() != null) {
                room.setDurationSeconds(Duration.between(room.getStartedAt(), now).getSeconds());
            } else {
                room.setDurationSeconds(0L);
            }
            room = roomRepository.save(room);

            try {
                messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId,
                        SignalingPayload.builder()
                                .type("END")
                                .senderUserPublicId(principal.getPublicId())
                                .build());
            } catch (Exception e) {
                log.warn("Signaling dispatch failed: {}", e.getMessage());
            }
            log.info("Meeting room {} ended by user {}. Total duration: {}s",
                    roomPublicId, principal.getUsername(), room.getDurationSeconds());
        }

        return MeetingRoomResponse.fromEntity(room, getIceServers());
    }

    public void relaySignal(UserPrincipal principal, String roomPublicId, SignalingPayload payload) {
        MeetingRoom room = getRoomOrThrow(roomPublicId);
        validateParticipantOrAdmin(room, principal);

        payload.setSenderUserPublicId(principal.getPublicId());
        try {
            messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId, payload);
        } catch (Exception e) {
            log.warn("Signal relay failed: {}", e.getMessage());
        }
    }

    public List<IceServerConfig> getIceServers() {
        List<IceServerConfig> configs = new ArrayList<>();
        if (StringUtils.hasText(stunServer)) {
            configs.add(IceServerConfig.builder().urls(List.of(stunServer)).build());
        }
        if (StringUtils.hasText(turnServer)) {
            configs.add(IceServerConfig.builder()
                    .urls(List.of(turnServer))
                    .username(turnUsername)
                    .credential(turnCredential)
                    .build());
        }
        return configs;
    }

    private MeetingRoom getRoomOrThrow(String publicId) {
        return roomRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Meeting room not found."));
    }

    private void validateParticipantOrAdmin(MeetingRoom room, UserPrincipal principal) {
        boolean isAuthorized = room.isAuthorizedParticipant(principal.getPublicId()) ||
                "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(principal.getRole()) ||
                "ROLE_FIRM_ADMIN".equalsIgnoreCase(principal.getRole());

        if (!isAuthorized) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You are not an authorized participant in this consultation meeting.");
        }
    }
}
