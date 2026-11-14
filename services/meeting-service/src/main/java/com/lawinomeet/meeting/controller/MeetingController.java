package com.lawinomeet.meeting.controller;

import com.lawinomeet.meeting.dto.*;
import com.lawinomeet.meeting.security.UserPrincipal;
import com.lawinomeet.meeting.service.MeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<MeetingRoomResponse>> createOrGetRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRoomRequest request) {
        MeetingRoomResponse response = meetingService.createOrGetRoom(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Meeting room initialized successfully", response));
    }

    @GetMapping("/rooms/{roomPublicId}")
    public ResponseEntity<ApiResponse<MeetingRoomResponse>> getRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String roomPublicId) {
        MeetingRoomResponse response = meetingService.getRoom(principal, roomPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Meeting room details retrieved", response));
    }

    @GetMapping("/appointments/{appointmentPublicId}/room")
    public ResponseEntity<ApiResponse<MeetingRoomResponse>> getRoomByAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String appointmentPublicId) {
        MeetingRoomResponse response = meetingService.getRoomByAppointment(principal, appointmentPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Meeting room retrieved for appointment", response));
    }

    @PostMapping("/rooms/{roomPublicId}/join")
    public ResponseEntity<ApiResponse<JoinRoomResponse>> joinRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String roomPublicId) {
        JoinRoomResponse response = meetingService.joinRoom(principal, roomPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Joined meeting room successfully", response));
    }

    @PostMapping("/rooms/{roomPublicId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String roomPublicId) {
        meetingService.leaveRoom(principal, roomPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Left meeting room", null));
    }

    @PatchMapping("/rooms/{roomPublicId}/end")
    public ResponseEntity<ApiResponse<MeetingRoomResponse>> endRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String roomPublicId) {
        MeetingRoomResponse response = meetingService.endRoom(principal, roomPublicId);
        return ResponseEntity.ok(ApiResponse.ok("Meeting room ended", response));
    }

    @PostMapping("/rooms/{roomPublicId}/signal")
    public ResponseEntity<ApiResponse<Void>> relaySignal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String roomPublicId,
            @Valid @RequestBody SignalingPayload payload) {
        meetingService.relaySignal(principal, roomPublicId, payload);
        return ResponseEntity.ok(ApiResponse.ok("Signal relayed", null));
    }

    @GetMapping("/ice-servers")
    public ResponseEntity<ApiResponse<List<IceServerConfig>>> getIceServers() {
        List<IceServerConfig> configs = meetingService.getIceServers();
        return ResponseEntity.ok(ApiResponse.ok("ICE servers retrieved", configs));
    }
}
