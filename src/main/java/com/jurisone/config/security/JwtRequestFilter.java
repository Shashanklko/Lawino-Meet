package com.jurisone.config.security;

import com.jurisone.auth.service.CustomUserDetailsService;
import com.jurisone.auth.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// @Component registers this as a bean so Spring knows our Bouncer exists
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.jurisone.common.service.AuditLogService auditLogService;

    // This method fires BEFORE every single HTTP request hits a Controller
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // 1. Look for the VIP Pass in the "Authorization" HTTP Header
        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // 2. A JWT should look like: "Bearer asdf123.zxvc456.qwer789"
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7); // Cut off the word "Bearer " to isolate the exact token
            try {
                username = jwtUtil.extractUsername(jwt); // Use our math machine to extract the user's email
            } catch (Exception e) {
                // If the token is "null", "undefined", or just garbage, we catch the crash here.
                String ip = request.getRemoteAddr();
                auditLogService.logSecurityAlert(
                    "Malformed JWT received",
                    "Token: " + jwt + " | Error: " + e.getMessage(),
                    ip,
                    null,
                    "ANONYMOUS"
                );
            }
        }

        // 3. If we found a username in the token, but Spring hasn't logged them in yet...
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            try {
                // 4. Check if the token is valid (this relies entirely on Math, NO DATABASE!)
                if (!jwtUtil.isTokenExpired(jwt)) {
    
                    // Extract their Role directly from the VIP Pass!
                    String role = jwtUtil.extractClaim(jwt, "role", String.class);
    
                    // Grant them their official Spring Security Badge based on the token
                    java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities = 
                            java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(role));
    
                    // STAMP THEIR HAND! (Log them in automatically)
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, authorities);
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // If the token is tampered with or expired, the Math fails and throws an exception.
                // We do nothing, and the request is bounced!
            }
        }

        
        // 6. Open the door and let the request continue to its destination (or the next filter)
        chain.doFilter(request, response);
    }
}
