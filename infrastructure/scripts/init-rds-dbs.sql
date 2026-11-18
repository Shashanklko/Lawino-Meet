-- =========================================================================
-- LawinoMeet Multi-Microservice Database Initialization & Seed for AWS RDS
-- Run this once on your new RDS MySQL instance using any MySQL client:
-- mysql -h <your-rds-endpoint> -u admin -p < init-rds-dbs.sql
-- =========================================================================

-- 1. Auth Service Database
CREATE DATABASE IF NOT EXISTS `auth_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 2. User & Profile Service Database
CREATE DATABASE IF NOT EXISTS `user_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 3. Appointment & Slots Service Database
CREATE DATABASE IF NOT EXISTS `appointment_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 4. Video Meeting Service Database
CREATE DATABASE IF NOT EXISTS `meeting_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 5. Notification Service Database
CREATE DATABASE IF NOT EXISTS `notification_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 6. Chat & Messaging Service Database
CREATE DATABASE IF NOT EXISTS `chat_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- Verify database creation
SHOW DATABASES LIKE '%_db';

-- =========================================================================
-- SEED DATA & TEST ACCOUNTS
-- Universal Demo Password: Password123!
-- BCrypt Hash: $2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK
-- =========================================================================

-- =========================================================================
-- 1. AUTH SERVICE SEED (auth_db.users)
-- =========================================================================
USE `auth_db`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `account_status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `email_verified` BOOLEAN NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `public_id`, `username`, `email`, `password_hash`, `role`, `account_status`, `email_verified`)
VALUES
(1, '11111111-1111-1111-1111-111111111111', 'rohit_client', 'rohit.verma@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'CLIENT', 'ACTIVE', 1),
(2, '22222222-2222-2222-2222-222222222222', 'adv_meera', 'meera.deshmukh@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'LAWYER', 'ACTIVE', 1),
(3, '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'raghavan.nambiar@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'LAWYER', 'ACTIVE', 1),
(4, '44444444-4444-4444-4444-444444444444', 'firm_admin', 'admin@lexveritas.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'FIRM_ADMIN', 'ACTIVE', 1),
(5, '55555555-5555-5555-5555-555555555555', 'platform_admin', 'admin@lawinomeet.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'PLATFORM_ADMIN', 'ACTIVE', 1)
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`);

-- =========================================================================
-- 2. USER & PROFILE SERVICE SEED (user_db)
-- =========================================================================
USE `user_db`;

CREATE TABLE IF NOT EXISTS `legal_specializations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legal_specializations` (`id`, `code`, `name`, `description`)
VALUES
(1, 'CRIMINAL', 'Criminal Defense & Anticipatory Bail', 'FIR quashing, regular & anticipatory bail, trial defense'),
(2, 'CORPORATE', 'Corporate & Commercial Law', 'M&A, contract compliance, shareholder disputes, company law'),
(3, 'FAMILY', 'Family & Matrimonial Law', 'Divorce, custody, maintenance, domestic matters'),
(4, 'IPR', 'Intellectual Property (IPR)', 'Trademarks, patents, copyright enforcement'),
(5, 'CIVIL', 'Civil Litigation & Property Disputes', 'Title suits, partition, injunctions, consumer forums'),
(6, 'CYBER', 'Cyber Crime & IT Law', 'Data theft, online financial fraud, privacy breaches'),
(7, 'TAXATION', 'Taxation & GST Advisory', 'Direct and indirect tax appeals, GST tribunal matters'),
(8, 'CONSTITUTIONAL', 'Constitutional & Writ Petitions', 'Article 226/32 writs before High Courts and Supreme Court')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

CREATE TABLE IF NOT EXISTS `client_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_public_id` VARCHAR(36) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `full_name` VARCHAR(150),
    `phone` VARCHAR(25),
    `profile_image_url` VARCHAR(500),
    `city` VARCHAR(100),
    `state` VARCHAR(100),
    `country` VARCHAR(100) DEFAULT 'India',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `client_profiles` (`user_public_id`, `username`, `full_name`, `phone`, `city`, `state`, `country`)
VALUES
('11111111-1111-1111-1111-111111111111', 'rohit_client', 'Rohit Verma', '+91 98102 33491', 'Delhi', 'Delhi', 'India')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

CREATE TABLE IF NOT EXISTS `law_firms` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `admin_user_public_id` VARCHAR(36) NOT NULL,
    `firm_name` VARCHAR(200) NOT NULL UNIQUE,
    `slug` VARCHAR(150) NOT NULL UNIQUE,
    `description` TEXT,
    `logo_url` VARCHAR(500),
    `contact_email` VARCHAR(150) NOT NULL,
    `contact_phone` VARCHAR(25),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(100),
    `country` VARCHAR(100) DEFAULT 'India',
    `verification_status` VARCHAR(30) DEFAULT 'VERIFIED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `law_firms` (`public_id`, `admin_user_public_id`, `firm_name`, `slug`, `description`, `contact_email`, `contact_phone`, `address`, `city`, `state`, `verification_status`)
VALUES
('firm-001-lex-veritas', '44444444-4444-4444-4444-444444444444', 'Lex Veritas Legal LLP', 'lex-veritas-legal-llp', 'Premier full-service legal counsel with High Court chambers in Mumbai and New Delhi.', 'admin@lexveritas.com', '+91 22 6677 8899', 'Chamber 412, High Court Commercial Wing', 'Mumbai', 'Maharashtra', 'VERIFIED'),
('firm-002-shardul-partners', '44444444-4444-4444-4444-444444444444', 'Shardul & Chambers Legal LLP', 'shardul-chambers-legal-llp', 'Boutique dispute resolution and appellate practice firm specializing in Supreme Court litigation and NCLT matters.', 'contact@shardullegal.com', '+91 11 2338 9911', 'Barakhamba Road, Connaught Place', 'New Delhi', 'Delhi', 'VERIFIED'),
('firm-003-crest-law-partners', '44444444-4444-4444-4444-444444444444', 'Crestline Law Partners LLP', 'crestline-law-partners-llp', 'Technology, IPR, venture capital structuring and corporate compliance counsel across India.', 'advisory@crestlinelegal.com', '+91 80 4120 7700', 'MG Road, Central Business District', 'Bengaluru', 'Karnataka', 'VERIFIED')
ON DUPLICATE KEY UPDATE `firm_name` = VALUES(`firm_name`);

CREATE TABLE IF NOT EXISTS `lawyer_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_public_id` VARCHAR(36) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `biography` TEXT,
    `profile_image_url` VARCHAR(500),
    `qualification` VARCHAR(200),
    `experience_years` INT DEFAULT 0,
    `phone` VARCHAR(25),
    `email_public` VARCHAR(150),
    `city` VARCHAR(100),
    `state` VARCHAR(100),
    `country` VARCHAR(100) DEFAULT 'India',
    `messaging_enabled` BOOLEAN DEFAULT 1,
    `verification_status` VARCHAR(30) DEFAULT 'VERIFIED',
    `public_profile_status` VARCHAR(30) DEFAULT 'PUBLISHED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lawyer_profiles` (`id`, `user_public_id`, `username`, `slug`, `full_name`, `biography`, `qualification`, `experience_years`, `phone`, `email_public`, `city`, `state`, `messaging_enabled`, `verification_status`, `public_profile_status`)
VALUES
(1, '22222222-2222-2222-2222-222222222222', 'adv_meera', 'adv-meera-deshmukh', 'Adv. Meera Deshmukh', 'Independent counsel specializing in criminal defense, anticipatory bail, and Section 420 IPC matters.', 'B.A. LL.B (Hons), Bar Council of Delhi (D/1842/2012)', 12, '+91 98200 11223', 'meera.deshmukh@example.com', 'New Delhi', 'Delhi', 1, 'VERIFIED', 'PUBLISHED'),
(2, '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'adv-raghavan-nambiar', 'Adv. Raghavan Nambiar', 'Senior Partner at Lex Veritas Legal LLP handling corporate advisory, cross-border arbitration, and writ petitions.', 'LL.M (Commercial & Constitutional), Bar Council of Maharashtra & Goa', 18, '+91 98111 22334', 'raghavan.nambiar@example.com', 'Mumbai', 'Maharashtra', 1, 'VERIFIED', 'PUBLISHED')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

CREATE TABLE IF NOT EXISTS `firm_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `firm_id` BIGINT NOT NULL,
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `firm_role` VARCHAR(30) NOT NULL DEFAULT 'PARTNER',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED',
    `invited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `responded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `firm_members` (`firm_id`, `lawyer_user_public_id`, `firm_role`, `status`)
VALUES (1, '33333333-3333-3333-3333-333333333333', 'MANAGING_PARTNER', 'ACCEPTED')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

CREATE TABLE IF NOT EXISTS `legal_services` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `lawyer_profile_id` BIGINT,
    `firm_id` BIGINT,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `mode` VARCHAR(30) NOT NULL,
    `duration_minutes` INT NOT NULL DEFAULT 30,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legal_services` (`id`, `lawyer_profile_id`, `title`, `description`, `mode`, `duration_minutes`, `price`, `is_active`)
VALUES
(1, 1, 'Emergency Anticipatory Bail Consultation', 'Immediate defense strategy and bail petition briefing.', 'ONLINE', 30, 1800.00, 1),
(2, 1, 'Chamber Consultation (Physical)', 'In-person meeting at chamber complex with document review.', 'OFFLINE', 45, 2000.00, 1),
(3, 1, 'Legal Chat Advisory', 'Encrypted 1-on-1 direct messaging and case opinion.', 'ONLINE', 30, 800.00, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- =========================================================================
-- 3. APPOINTMENT SERVICE SEED (appointment_db)
-- =========================================================================
USE `appointment_db`;

CREATE TABLE IF NOT EXISTS `availability_slots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `start_time` TIMESTAMP NOT NULL,
    `end_time` TIMESTAMP NOT NULL,
    `slot_status` VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    `version` BIGINT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `availability_slots` (`id`, `public_id`, `lawyer_user_public_id`, `start_time`, `end_time`, `slot_status`)
VALUES
(1, 'slot-001', '22222222-2222-2222-2222-222222222222', '2026-11-17 10:00:00', '2026-11-17 10:45:00', 'BOOKED'),
(2, 'slot-002', '22222222-2222-2222-2222-222222222222', '2026-11-17 11:30:00', '2026-11-17 12:15:00', 'BOOKED'),
(3, 'slot-003', '22222222-2222-2222-2222-222222222222', '2026-11-17 15:00:00', '2026-11-17 15:45:00', 'AVAILABLE'),
(4, 'slot-004', '33333333-3333-3333-3333-333333333333', '2026-11-17 16:00:00', '2026-11-17 16:45:00', 'AVAILABLE')
ON DUPLICATE KEY UPDATE `slot_status` = VALUES(`slot_status`);

CREATE TABLE IF NOT EXISTS `appointments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `client_user_public_id` VARCHAR(36) NOT NULL,
    `client_username` VARCHAR(50) NOT NULL,
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `lawyer_username` VARCHAR(50),
    `firm_public_id` VARCHAR(36),
    `service_id` BIGINT,
    `slot_id` BIGINT NOT NULL,
    `consultation_type` VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    `consultation_reason` TEXT,
    `appointment_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `response_deadline` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `appointments` (`id`, `public_id`, `client_user_public_id`, `client_username`, `lawyer_user_public_id`, `lawyer_username`, `slot_id`, `consultation_type`, `consultation_reason`, `appointment_status`)
VALUES
(1, 'apt-001', '11111111-1111-1111-1111-111111111111', 'rohit_client', '22222222-2222-2222-2222-222222222222', 'adv_meera', 1, 'ONLINE', 'FIR registered under Section 420 IPC in Gurugram. Police visited residence today morning. Urgently need bail strategy before arrest.', 'PENDING')
ON DUPLICATE KEY UPDATE `appointment_status` = VALUES(`appointment_status`);

-- =========================================================================
-- 4. CHAT SERVICE SEED (chat_db)
-- =========================================================================
USE `chat_db`;

CREATE TABLE IF NOT EXISTS `chat_conversations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `participant_one_public_id` VARCHAR(36) NOT NULL,
    `participant_one_username` VARCHAR(50),
    `participant_two_public_id` VARCHAR(36) NOT NULL,
    `participant_two_username` VARCHAR(50),
    `last_message_content` VARCHAR(500),
    `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_conversations` (`id`, `public_id`, `participant_one_public_id`, `participant_one_username`, `participant_two_public_id`, `participant_two_username`, `last_message_content`)
VALUES
(1, 'conv-001', '11111111-1111-1111-1111-111111111111', 'rohit_client', '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'Please keep a clear photo or scan of the summons notice ready.')
ON DUPLICATE KEY UPDATE `last_message_content` = VALUES(`last_message_content`);

CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `conversation_id` BIGINT NOT NULL,
    `sender_user_public_id` VARCHAR(36) NOT NULL,
    `sender_username` VARCHAR(50),
    `recipient_user_public_id` VARCHAR(36) NOT NULL,
    `recipient_username` VARCHAR(50),
    `content` TEXT NOT NULL,
    `attachment_url` VARCHAR(500),
    `attachment_name` VARCHAR(255),
    `is_read` BOOLEAN DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_messages` (`id`, `public_id`, `conversation_id`, `sender_user_public_id`, `sender_username`, `recipient_user_public_id`, `recipient_username`, `content`, `is_read`)
VALUES
(1, 'msg-001', 1, '33333333-3333-3333-3333-333333333333', 'adv_raghavan', '11111111-1111-1111-1111-111111111111', 'rohit_client', 'Namaste Rohit, I have received your case overview regarding the police summons.', 1),
(2, 'msg-002', 1, '11111111-1111-1111-1111-111111111111', 'rohit_client', '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'Thank you Advocate. What documents should I have ready for the video consultation today?', 1),
(3, 'msg-003', 1, '33333333-3333-3333-3333-333333333333', 'adv_raghavan', '11111111-1111-1111-1111-111111111111', 'rohit_client', 'Please keep a clear photo or scan of the summons notice, the date it was delivered, and any bank transaction records.', 0)
ON DUPLICATE KEY UPDATE `content` = VALUES(`content`);

-- =========================================================================
-- 5. NOTIFICATION SERVICE SEED (notification_db)
-- =========================================================================
USE `notification_db`;

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `recipient_user_public_id` VARCHAR(36) NOT NULL,
    `recipient_username` VARCHAR(50),
    `notification_type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications` (`public_id`, `recipient_user_public_id`, `recipient_username`, `notification_type`, `title`, `message`, `is_read`)
VALUES
('notif-001', '11111111-1111-1111-1111-111111111111', 'rohit_client', 'APPOINTMENT_REQUESTED', 'Consultation Request Dispatched', 'Your emergency anticipatory bail consultation request was sent to Adv. Meera Deshmukh.', 0),
('notif-002', '22222222-2222-2222-2222-222222222222', 'adv_meera', 'APPOINTMENT_REQUESTED', 'New Consultation Request Received', 'Rohit Verma requested an emergency anticipatory bail consultation for today.', 0)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
