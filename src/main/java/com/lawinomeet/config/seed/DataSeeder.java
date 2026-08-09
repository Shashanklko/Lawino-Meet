package com.lawinomeet.config.seed;

import com.lawinomeet.consultation.entity.Consultation;
import com.lawinomeet.consultation.enums.ConsultationMode;
import com.lawinomeet.consultation.enums.ConsultationStatus;
import com.lawinomeet.consultation.repository.ConsultationRepository;
import com.lawinomeet.user.entity.ProfessionalProfile;
import com.lawinomeet.user.entity.User;
import com.lawinomeet.user.enums.Role;
import com.lawinomeet.user.repository.ProfessionalProfileRepository;
import com.lawinomeet.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 🌿 Separate DataSeeder Component
 * Responsible for seeding default initial data for testing, development, and demonstration.
 * Configured via app.seed-data.enabled (defaults to true).
 */
@Component
@ConditionalOnProperty(name = "app.seed-data.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("🌱 Database already contains data. Skipping DataSeeder execution.");
            return;
        }

        log.info("🌱 Seeding initial application database with test users and sample consultation...");

        // 1. Seed Admin User
        User admin = new User();
        admin.setEmail("admin@lawinomeet.com");
        admin.setFirstname("Admin");
        admin.setLastname("System");
        admin.setPassword(passwordEncoder.encode("Password123!"));
        admin.setRole(Role.ADMIN);
        admin.setGlobalTokenBalance(100);
        userRepository.save(admin);

        // 2. Seed Lawyer User & Profile
        User lawyer = new User();
        lawyer.setEmail("lawyer.john@lawinomeet.com");
        lawyer.setFirstname("John");
        lawyer.setLastname("Doe");
        lawyer.setPassword(passwordEncoder.encode("Password123!"));
        lawyer.setRole(Role.LAWYER);
        lawyer.setGlobalTokenBalance(20);
        User savedLawyer = userRepository.save(lawyer);

        ProfessionalProfile lawyerProfile = new ProfessionalProfile();
        lawyerProfile.setUser(savedLawyer);
        lawyerProfile.setCategory(Role.LAWYER);
        lawyerProfile.setSpecialization("Corporate & Property Law");
        lawyerProfile.setBio("Senior Legal Advocate with over 12 years experience in property dispute resolution.");
        lawyerProfile.setOfficeAddress("101 Legal Heights, Connaught Place, New Delhi");
        lawyerProfile.setConsultationFee(500.0);
        lawyerProfile.setChatUnlockFee(99.0);
        lawyerProfile.setIsVerified(true);
        lawyerProfile.setWalletBalance(1000.0);
        professionalProfileRepository.save(lawyerProfile);

        // 3. Seed Client User
        User client = new User();
        client.setEmail("client.sam@lawinomeet.com");
        client.setFirstname("Sam");
        client.setLastname("Smith");
        client.setPassword(passwordEncoder.encode("Password123!"));
        client.setRole(Role.CLIENT);
        client.setGlobalTokenBalance(10);
        User savedClient = userRepository.save(client);

        // 4. Seed Sample Consultation Request
        Consultation consultation = new Consultation();
        consultation.setMeetingCode("MEET-SEED-101");
        consultation.setClientId(savedClient.getId());
        consultation.setLawyerId(savedLawyer.getId());
        consultation.setClientName(savedClient.getFirstname() + " " + savedClient.getLastname());
        consultation.setClientEmail(savedClient.getEmail());
        consultation.setClientPhoneNumber("+919876543210");
        consultation.setLocation("Delhi");
        consultation.setQuery("Need assistance reviewing property title documents.");
        consultation.setMode(ConsultationMode.ONLINE_VIDEO);
        consultation.setRequestedTimeSlot(LocalDateTime.now().plusDays(2));
        consultation.setStatus(ConsultationStatus.SUBMITTED);
        consultation.setIsContactInfoDisclosed(false);
        consultationRepository.save(consultation);

        log.info("✅ Database seeding finished successfully. Sample Admin, Lawyer, Client, and Consultation created.");
    }
}
