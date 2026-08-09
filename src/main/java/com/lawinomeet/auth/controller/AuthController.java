package com.lawinomeet.auth.controller;

import javax.management.BadBinaryOpValueExpException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lawinomeet.auth.dto.AuthRequest;
import com.lawinomeet.auth.dto.AuthResponse;
import com.lawinomeet.auth.service.CustomUserDetailsService;
import com.lawinomeet.auth.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authManager;
    @Autowired
    private CustomUserDetailsService UserDetailsService;
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.lawinomeet.user.service.UserService userService;

    @Autowired
    private com.lawinomeet.common.service.AuditLogService auditLogService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.lawinomeet.user.dto.UserRequest userRequest) {
        log.info("New registration attempt for email: {}", userRequest.getEmail());
        return ResponseEntity.ok(userService.createUser(userRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest, jakarta.servlet.http.HttpServletRequest request){
        String email = authRequest.getEmail();
        String ip = request.getRemoteAddr();
        
        try{
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, authRequest.getPassword()));
            
            log.info("Login SUCCESS for email: {} | IP: {}", email, ip);
            
            UserDetails userDetails = UserDetailsService.loadUserByUsername(email);
            final String jwt = jwtUtil.generateToken(userDetails);
            String role = userDetails.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse("USER");
            
            auditLogService.logAudit("LOGIN_SUCCESS", "User logged in successfully", ip, email, role);
            
            return ResponseEntity.ok(new AuthResponse(jwt, "Login successful"));
            
        } catch(BadCredentialsException e){
            log.warn("Login FAILED for email: {} | IP: {}", email, ip);
            auditLogService.logSecurityAlert("Login Failed", "Incorrect password attempted", ip, email, "UNDEFINED");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect email or password");
        } catch(Exception e) {
            log.error("Login ERROR for email: {} | Error: {}", email, e.getMessage());
            auditLogService.logCriticalError("Login System Error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during login");
        }
    }
    
}
