package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.UserRequest;
import com.lawinomeet.user.dto.UserResponse;
import com.lawinomeet.user.entity.User;
import com.lawinomeet.common.exception.ResourceNotFoundException;
import com.lawinomeet.user.repository.UserRepository;
import com.lawinomeet.user.enums.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeet.user.entity.ProfessionalProfile;
import java.util.List;
import java.util.stream.Collectors;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// @Service tells Spring: "This is a special class that holds business logic." 
// Spring will automatically create an object of this class when the app starts.
@Service
public class UserServiceImp implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImp.class);

    // @Autowired tells Spring: "Look for a UserRepository bean and plug it in here automatically."
    // This connects our Service layer to the Database layer without needing 'new UserRepository()'.
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    // --- CREATE A NEW USER ---
    @Override
    public UserResponse createUser(UserRequest userRequest) {
        
        // 1. Check if email already exists
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("Email already in use: " + userRequest.getEmail());
        }

        // 2. The Controller gave us a UserRequest DTO...
        User user = mapToEntity(userRequest);
        
        // 2. We ask the UserRepository to save this new Entity into the MySQL/MongoDB database.
        // It returns the saved User (which now has a generated ID attached to it!).
        User savedUser = userRepository.save(user);
        log.info("New USER created successfully: {} (Role: {})", savedUser.getEmail(), savedUser.getRole());

        // 3. New logic: If the user is a Lawyer, CA, or Other professional, create an empty profile.
        if (savedUser.getRole() == Role.LAWYER || savedUser.getRole() == Role.CA || savedUser.getRole() == Role.OTHER) {
            createProfessionalProfile(savedUser);
        }
        
        // 4. We can't send the Entity back to the Controller (security/best-practices).
        // So, we translate the saved Entity into a UserResponse DTO and return it.
        return mapToResponse(savedUser); 
    }

    private void createProfessionalProfile(User user) {
        ProfessionalProfile profile = new ProfessionalProfile();
        profile.setUser(user);
        profile.setCategory(user.getRole());
        // Default values are already set in entity
        professionalProfileRepository.save(profile);
        log.info("Created PROFESSIONAL PROFILE for User: {}", user.getEmail());
    }

    // --- GET ONE USER BY ID ---
    @Override
    public UserResponse getUserById(Long id) {
        // 1. We ask the DB to find the user by ID. 
        // findById returns an 'Optional' (because the user might not exist).
        // .orElseThrow() means: "If you find it, give me the User. If not, crash gracefully with this error."
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // 2. Translate the found database Entity into a secure Response DTO.
        return mapToResponse(user);
    }

    // --- GET ALL USERS ---
    @Override
    public List<UserResponse> getAllUsers(Role role) {
        List<User> users;
        if (role != null) {
            users = userRepository.findByRole(role);
        } else {
            users = userRepository.findAll();
        }
        
        return users.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- UPDATE AN EXISTING USER ---
    @Override
    public UserResponse updateUser(Long id, UserRequest userRequest) {
        
        // 1. Check if the user we are trying to update actually exists in the DB.
        // If not, throw an error.
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Update failed: User ID {} not found", id);
                    return new ResourceNotFoundException("User not found");
                });

        // 2. Overwrite the old database data with the new data from the UserRequest DTO.
        existingUser.setFirstname(userRequest.getFirstname());
        existingUser.setLastname(userRequest.getLastname());
        
        // 3. If email is changing, check for uniqueness
        if (!existingUser.getEmail().equalsIgnoreCase(userRequest.getEmail())) {
            if (userRepository.existsByEmail(userRequest.getEmail())) {
                throw new RuntimeException("Email already in use: " + userRequest.getEmail());
            }
            existingUser.setEmail(userRequest.getEmail());
        }
        existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        existingUser.setRole(userRequest.getRole());

        // 3. Save the modified user back to the database. (Spring knows to UPDATE instead of CREATE because it already has an ID).
        User updatedUser = userRepository.save(existingUser);
        log.info("USER updated successfully: {} (ID: {})", updatedUser.getEmail(), updatedUser.getId());
        
        // 4. Translate the updated database Entity into a secure Response DTO.
        return mapToResponse(updatedUser);
    }

    // --- DELETE A USER ---
    @Override
    public void deleteUser(Long id) {
        // Tells the database to permanently delete the row matching this ID.
        userRepository.deleteById(id);
        log.info("USER deleted successfully: ID {}", id);
    }

    // ==========================================
    // --- HELPER TRANSLATION (MAPPING) METHODS ---
    // ==========================================

    // This method takes a UserRequest (Frontend Data) and turns it into a User (Database Data)
    private User mapToEntity(UserRequest request) {
        User user = new User(); // Create a blank Database User
        user.setFirstname(request.getFirstname()); // Copy the First Name over
        user.setLastname(request.getLastname());   // Copy the Last Name over
        user.setEmail(request.getEmail());         // Copy the Email over
        user.setPassword(passwordEncoder.encode(request.getPassword()));   // Copy the Password over
        user.setRole(request.getRole());           // Copy the Role over
        return user; // Return the fully packed Database User
    }

    // This method takes a User (Database Data) and turns it into a UserResponse (Frontend Data)
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse(); // Create a blank Response
        response.setId(user.getId());               // Expose the Database ID
        response.setFirstname(user.getFirstname()); // Expose the First Name
        response.setLastname(user.getLastname());   // Expose the Last Name
        response.setEmail(user.getEmail());         // Expose the Email
        response.setRole(user.getRole());           // Expose the Role
        
        // NOTICE: We specifically DO NOT add the password to 'response'.
        // This guarantees the password never accidentally gets sent back to the internet!
        
        if (user.getProfessionalProfile() != null) {
            UserResponse.ProfessionalProfileDto profileDto = new UserResponse.ProfessionalProfileDto();
            profileDto.setCategory(user.getProfessionalProfile().getCategory() != null ? user.getProfessionalProfile().getCategory().name() : null);
            profileDto.setCustomGreeting(user.getProfessionalProfile().getCustomGreeting());
            profileDto.setOfficeAddress(user.getProfessionalProfile().getOfficeAddress());
            profileDto.setChatUnlockFee(user.getProfessionalProfile().getChatUnlockFee());
            profileDto.setConsultationFee(user.getProfessionalProfile().getConsultationFee());
            profileDto.setIsVerified(user.getProfessionalProfile().getIsVerified());
            profileDto.setSpecialization(user.getProfessionalProfile().getSpecialization());
            profileDto.setBio(user.getProfessionalProfile().getBio());
            response.setProfile(profileDto);
        }

        return response; // Return the safe, secure Response object
    }
}
