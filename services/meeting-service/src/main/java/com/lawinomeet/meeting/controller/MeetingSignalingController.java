package com.lawinomeet.meeting.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MeetingSignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * WebRTC SDP Offer/Answer/ICE Candidate Relay for 1:1 Consultation
     * Destination: /app/meeting.signal/{roomPublicId}
     * Broadcasts to: /topic/rooms/{roomPublicId}
     */
    @MessageMapping("/meeting.signal/{roomPublicId}")
    public void relayWebRtcSignal(@DestinationVariable String roomPublicId, @Payload Object signalPayload) {
        log.debug("Relaying 1:1 WebRTC signal for room: {}", roomPublicId);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomPublicId, signalPayload);
    }
}
