package com.lawinomeet.meeting.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenValidator tokenValidator;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                token = accessor.getFirstNativeHeader("token");
            }

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            if (token != null && tokenValidator.validateToken(token)) {
                UserPrincipal principal = tokenValidator.extractUserPrincipal(token);
                accessor.setUser(principal);
                log.info("Authenticated STOMP meeting connection for user: {}", principal.getUsername());
            } else {
                log.warn("Unauthenticated STOMP CONNECT on /ws-meeting rejected");
                // Do not set user if invalid
            }
        }
        return message;
    }
}
