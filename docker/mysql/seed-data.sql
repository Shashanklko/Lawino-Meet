-- =========================================================================
-- LawinoMeet - Minimal Production-Ready Seed Data
-- Strict Entity Requirement:
--   1. One Client (rohit_client / CLT1001)
--   2. One Super Admin (platform_admin / ADM1001)
--   3. Two Lawyers (adv_raghavan / LAW1001, adv_meera / LAW1002)
--   4. One Law Firm (Lex Veritas Legal LLP / FRM1001)
-- Universal password for seeded accounts: Password123!
-- BCrypt Hash: $2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK
-- ZERO dummy appointments, chats, notifications, transactions, or static slots.
-- =========================================================================

-- =========================================================================
-- 1. AUTH SERVICE SCHEMA & SEED (auth_db)
-- =========================================================================
USE `auth_db`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `short_uid` VARCHAR(7) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `account_status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `email_verified` BOOLEAN NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_public_id` (`public_id`),
    INDEX `idx_users_short_uid` (`short_uid`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `public_id`, `short_uid`, `username`, `email`, `password_hash`, `role`, `account_status`, `email_verified`, `created_at`, `updated_at`)
VALUES
(1, '11111111-1111-1111-1111-111111111111', 'CLT1001', 'rohit_client', 'rohit.verma@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'CLIENT', 'ACTIVE', 1, NOW(), NOW()),
(2, '55555555-5555-5555-5555-555555555555', 'ADM1001', 'platform_admin', 'admin@lawinomeet.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'PLATFORM_ADMIN', 'ACTIVE', 1, NOW(), NOW()),
(3, '33333333-3333-3333-3333-333333333333', 'LAW1001', 'adv_raghavan', 'raghavan.nambiar@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'LAWYER', 'ACTIVE', 1, NOW(), NOW()),
(4, '22222222-2222-2222-2222-222222222222', 'LAW1002', 'adv_meera', 'meera.deshmukh@example.com', '$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK', 'LAWYER', 'ACTIVE', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    `password_hash` = VALUES(`password_hash`),
    `short_uid` = VALUES(`short_uid`),
    `created_at` = NOW(),
    `updated_at` = NOW();

-- =========================================================================
-- 2. USER & PROFILE SERVICE SCHEMA & SEED (user_db)
-- =========================================================================
USE `user_db`;

-- Legal Specializations Reference Table
CREATE TABLE IF NOT EXISTS `legal_specializations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legal_specializations` (`id`, `name`, `description`)
VALUES
(1, 'Criminal Defense & Anticipatory Bail', 'FIR quashing, regular & anticipatory bail, trial defense'),
(2, 'Corporate & Commercial Law', 'M&A, contract compliance, shareholder disputes, company law'),
(3, 'Family & Matrimonial Law', 'Divorce, custody, maintenance, domestic matters'),
(4, 'Intellectual Property (IPR)', 'Trademarks, patents, copyright enforcement'),
(5, 'Civil Litigation & Property Disputes', 'Title suits, partition, injunctions, consumer forums'),
(6, 'Cyber Crime & IT Law', 'Data theft, online financial fraud, privacy breaches'),
(7, 'Taxation & GST Advisory', 'Direct and indirect tax appeals, GST tribunal matters'),
(8, 'Constitutional & Writ Petitions', 'Article 226/32 writs before High Courts and Supreme Court')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Client Profiles
CREATE TABLE IF NOT EXISTS `client_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_public_id` VARCHAR(36) NOT NULL UNIQUE,
    `short_uid` VARCHAR(7) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `full_name` VARCHAR(150),
    `phone` VARCHAR(25),
    `profile_image_url` VARCHAR(500),
    `city` VARCHAR(100),
    `state` VARCHAR(100),
    `country` VARCHAR(100) DEFAULT 'India',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_client_short_uid` (`short_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `client_profiles` (`id`, `user_public_id`, `short_uid`, `username`, `full_name`, `phone`, `city`, `state`, `country`)
VALUES
(1, '11111111-1111-1111-1111-111111111111', 'CLT1001', 'rohit_client', 'Rohit Verma', '+91 98102 33491', 'Delhi', 'Delhi', 'India')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `short_uid` = VALUES(`short_uid`);

-- Law Firms
CREATE TABLE IF NOT EXISTS `law_firms` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `short_uid` VARCHAR(7) NOT NULL UNIQUE,
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
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_firm_short_uid` (`short_uid`),
    INDEX `idx_firm_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `law_firms` (`id`, `public_id`, `short_uid`, `admin_user_public_id`, `firm_name`, `slug`, `description`, `contact_email`, `contact_phone`, `address`, `city`, `state`, `verification_status`)
VALUES
(1, '44444444-4444-4444-4444-444444444444', 'FRM1001', '33333333-3333-3333-3333-333333333333', 'Lex Veritas Legal LLP', 'lex-veritas-legal-llp', 'Premier full-service legal counsel with High Court chambers in Mumbai and New Delhi.', 'admin@lexveritas.com', '+91 22 6677 8899', 'Chamber 412, High Court Commercial Wing', 'Mumbai', 'Maharashtra', 'VERIFIED')
ON DUPLICATE KEY UPDATE `firm_name` = VALUES(`firm_name`), `short_uid` = VALUES(`short_uid`);

-- Lawyer Profiles (Dynamic availability configuration; no predefined static slots)
CREATE TABLE IF NOT EXISTS `lawyer_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_public_id` VARCHAR(36) NOT NULL UNIQUE,
    `short_uid` VARCHAR(7) NOT NULL UNIQUE,
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
    `working_days` VARCHAR(255) DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY',
    `working_hours_start` VARCHAR(10) DEFAULT '09:00',
    `working_hours_end` VARCHAR(10) DEFAULT '18:00',
    `break_start_time` VARCHAR(10) DEFAULT '13:00',
    `break_end_time` VARCHAR(10) DEFAULT '14:00',
    `time_zone` VARCHAR(50) DEFAULT 'Asia/Kolkata',
    `availability_status` VARCHAR(30) DEFAULT 'AVAILABLE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_lawyer_short_uid` (`short_uid`),
    INDEX `idx_lawyer_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lawyer_profiles` (`id`, `user_public_id`, `short_uid`, `username`, `slug`, `full_name`, `biography`, `qualification`, `experience_years`, `phone`, `email_public`, `city`, `state`, `messaging_enabled`, `verification_status`, `public_profile_status`, `working_days`, `working_hours_start`, `working_hours_end`, `break_start_time`, `break_end_time`, `time_zone`, `availability_status`)
VALUES
(1, '33333333-3333-3333-3333-333333333333', 'LAW1001', 'adv_raghavan', 'adv-raghavan-nambiar', 'Adv. Raghavan Nambiar', 'Senior Partner at Lex Veritas Legal LLP handling corporate advisory, cross-border arbitration, and writ petitions.', 'LL.M (Commercial & Constitutional), Bar Council of Maharashtra & Goa', 18, '+91 98111 22334', 'raghavan.nambiar@example.com', 'Mumbai', 'Maharashtra', 1, 'VERIFIED', 'PUBLISHED', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', '09:00', '18:00', '13:00', '14:00', 'Asia/Kolkata', 'AVAILABLE'),
(2, '22222222-2222-2222-2222-222222222222', 'LAW1002', 'adv_meera', 'adv-meera-deshmukh', 'Adv. Meera Deshmukh', 'Independent counsel specializing in criminal defense, anticipatory bail, and Section 420 IPC matters.', 'B.A. LL.B (Hons), Bar Council of Delhi (D/1842/2012)', 12, '+91 98200 11223', 'meera.deshmukh@example.com', 'New Delhi', 'Delhi', 1, 'VERIFIED', 'PUBLISHED', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', '10:00', '19:00', '13:30', '14:30', 'Asia/Kolkata', 'AVAILABLE')
ON DUPLICATE KEY UPDATE 
    `full_name` = VALUES(`full_name`),
    `short_uid` = VALUES(`short_uid`),
    `slug` = VALUES(`slug`),
    `working_days` = VALUES(`working_days`),
    `working_hours_start` = VALUES(`working_hours_start`),
    `working_hours_end` = VALUES(`working_hours_end`);

-- Lawyer Specializations Join Table
CREATE TABLE IF NOT EXISTS `lawyer_specializations` (
    `lawyer_profile_id` BIGINT NOT NULL,
    `specialization_id` BIGINT NOT NULL,
    PRIMARY KEY (`lawyer_profile_id`, `specialization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lawyer_specializations` (`lawyer_profile_id`, `specialization_id`)
VALUES
(1, 2), -- Adv Raghavan -> Corporate
(1, 8), -- Adv Raghavan -> Constitutional
(2, 1), -- Adv Meera -> Criminal
(2, 6)  -- Adv Meera -> Cyber
ON DUPLICATE KEY UPDATE `specialization_id` = VALUES(`specialization_id`);

-- Firm Members Link
CREATE TABLE IF NOT EXISTS `firm_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `firm_id` BIGINT NOT NULL,
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `lawyer_username` VARCHAR(50),
    `role_in_firm` VARCHAR(30) NOT NULL DEFAULT 'ASSOCIATE',
    `membership_status` VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED',
    `invited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `accepted_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_firm_member` (`firm_id`, `lawyer_user_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `firm_members` (`firm_id`, `lawyer_user_public_id`, `lawyer_username`, `role_in_firm`, `membership_status`)
VALUES (1, '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'MANAGING_PARTNER', 'ACCEPTED')
ON DUPLICATE KEY UPDATE `membership_status` = VALUES(`membership_status`);

-- Legal Consultation Services
CREATE TABLE IF NOT EXISTS `legal_services` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `lawyer_profile_id` BIGINT,
    `firm_id` BIGINT,
    `service_name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `consultation_type` VARCHAR(30) NOT NULL,
    `duration_minutes` INT NOT NULL DEFAULT 60,
    `consultation_fee` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legal_services` (`id`, `lawyer_profile_id`, `firm_id`, `service_name`, `description`, `consultation_type`, `duration_minutes`, `consultation_fee`, `currency`, `is_active`)
VALUES
(1, 1, 1, 'Corporate Legal Advisory', 'Comprehensive commercial advisory, contracts, and cross-border arbitration briefing.', 'ONLINE', 60, 2500.00, 'INR', 1),
(2, 2, NULL, 'Anticipatory Bail & Criminal Defense', 'Immediate defense strategy, bail petition analysis, and litigation review.', 'ONLINE', 60, 1800.00, 'INR', 1)
ON DUPLICATE KEY UPDATE `consultation_fee` = VALUES(`consultation_fee`);

-- Wallets Table (Strict ₹0 initial balance)
CREATE TABLE IF NOT EXISTS `wallets` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `user_public_id` VARCHAR(36) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL,
    `user_role` VARCHAR(30) NOT NULL,
    `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `escrow_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `version` BIGINT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_wallet_public_id` (`public_id`),
    INDEX `idx_wallet_user` (`user_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `wallets` (`id`, `public_id`, `user_public_id`, `username`, `user_role`, `balance`, `escrow_balance`)
VALUES
(1, 'wlt-clt-001', '11111111-1111-1111-1111-111111111111', 'rohit_client', 'CLIENT', 0.00, 0.00),
(2, 'wlt-law-001', '33333333-3333-3333-3333-333333333333', 'adv_raghavan', 'LAWYER', 0.00, 0.00),
(3, 'wlt-law-002', '22222222-2222-2222-2222-222222222222', 'adv_meera', 'LAWYER', 0.00, 0.00)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- Wallet Transactions Table (Zero dummy transactions seeded)
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `wallet_id` BIGINT NOT NULL,
    `user_public_id` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    `reference_id` VARCHAR(100),
    `description` VARCHAR(300),
    `payment_method` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_wtx_public_id` (`public_id`),
    INDEX `idx_wtx_user` (`user_public_id`),
    INDEX `idx_wtx_ref` (`reference_id`),
    INDEX `idx_wtx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- 3. APPOINTMENT SERVICE SCHEMA (appointment_db)
-- Zero predefined static slots or dummy appointments seeded.
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
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_slot_lawyer_time` (`lawyer_user_public_id`, `start_time`, `end_time`),
    INDEX `idx_slot_status` (`slot_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `short_uid` VARCHAR(7) NOT NULL UNIQUE,
    `client_user_public_id` VARCHAR(36) NOT NULL,
    `client_username` VARCHAR(50) NOT NULL,
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `lawyer_username` VARCHAR(50),
    `firm_public_id` VARCHAR(36),
    `service_id` BIGINT,
    `fee` DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
    `slot_id` BIGINT NULL,
    `start_time` TIMESTAMP NULL,
    `end_time` TIMESTAMP NULL,
    `consultation_type` VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    `consultation_reason` TEXT,
    `appointment_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    `payment_method` VARCHAR(30) DEFAULT 'WALLET',
    `paid_at` TIMESTAMP NULL,
    `meeting_room_public_id` VARCHAR(100),
    `chat_conversation_public_id` VARCHAR(100),
    `alternative_slot_public_id` VARCHAR(100),
    `preferred_slots_json` VARCHAR(1000),
    `chamber_address` VARCHAR(500),
    `directions_instructions` VARCHAR(500),
    `rejection_reason` VARCHAR(500),
    `cancellation_reason` VARCHAR(500),
    `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `accepted_at` TIMESTAMP NULL,
    `rejected_at` TIMESTAMP NULL,
    `cancelled_at` TIMESTAMP NULL,
    `completion_requested_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `client_confirmed_at` TIMESTAMP NULL,
    `settled_at` TIMESTAMP NULL,
    `settlement_status` VARCHAR(30) DEFAULT 'UNSETTLED',
    `response_deadline` TIMESTAMP NULL,
    `auto_release_at` TIMESTAMP NULL,
    `version` BIGINT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_apt_public_id` (`public_id`),
    INDEX `idx_apt_short_uid` (`short_uid`),
    INDEX `idx_apt_client` (`client_user_public_id`),
    INDEX `idx_apt_lawyer` (`lawyer_user_public_id`),
    INDEX `idx_apt_time_range` (`lawyer_user_public_id`, `start_time`, `end_time`),
    INDEX `idx_apt_status` (`appointment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- 4. CHAT SERVICE SCHEMA (chat_db)
-- Zero dummy conversations or messages seeded.
-- =========================================================================
USE `chat_db`;

CREATE TABLE IF NOT EXISTS `chat_conversations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(100) NOT NULL UNIQUE,
    `appointment_public_id` VARCHAR(100),
    `participant_one_public_id` VARCHAR(36) NOT NULL,
    `participant_one_username` VARCHAR(50),
    `participant_two_public_id` VARCHAR(36) NOT NULL,
    `participant_two_username` VARCHAR(50),
    `last_message_content` VARCHAR(500),
    `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_conv_public_id` (`public_id`),
    INDEX `idx_conv_p1` (`participant_one_public_id`),
    INDEX `idx_conv_p2` (`participant_two_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `reply_to_message_public_id` VARCHAR(36) NULL,
    `reply_to_sender_name` VARCHAR(100) NULL,
    `reply_to_content` VARCHAR(500) NULL,
    `deleted_for_everyone` BOOLEAN NOT NULL DEFAULT 0,
    `deleted_for_user_ids` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_msg_public_id` (`public_id`),
    INDEX `idx_msg_conv` (`conversation_id`),
    INDEX `idx_msg_sender` (`sender_user_public_id`),
    INDEX `idx_msg_recipient` (`recipient_user_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- 5. NOTIFICATION SERVICE SCHEMA (notification_db)
-- Zero dummy notifications seeded.
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
    `reference_type` VARCHAR(50),
    `reference_id` VARCHAR(100),
    `is_read` BOOLEAN DEFAULT 0,
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notif_public_id` (`public_id`),
    INDEX `idx_notif_recipient` (`recipient_user_public_id`, `is_read`),
    INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- 6. MEETING SERVICE SCHEMA (meeting_db)
-- Zero dummy rooms or participants seeded.
-- =========================================================================
USE `meeting_db`;

CREATE TABLE IF NOT EXISTS `meeting_rooms` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `appointment_public_id` VARCHAR(36) NOT NULL,
    `client_user_public_id` VARCHAR(36) NOT NULL,
    `client_username` VARCHAR(50),
    `lawyer_user_public_id` VARCHAR(36) NOT NULL,
    `lawyer_username` VARCHAR(50),
    `room_status` VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    `room_token` VARCHAR(64) NOT NULL,
    `started_at` TIMESTAMP NULL,
    `ended_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mroom_public_id` (`public_id`),
    INDEX `idx_mroom_appointment` (`appointment_public_id`),
    INDEX `idx_mroom_client` (`client_user_public_id`),
    INDEX `idx_mroom_lawyer` (`lawyer_user_public_id`),
    INDEX `idx_mroom_status` (`room_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meeting_participants` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(36) NOT NULL UNIQUE,
    `room_id` BIGINT NOT NULL,
    `user_public_id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50),
    `role` VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `left_at` TIMESTAMP NULL,
    INDEX `idx_mpart_public_id` (`public_id`),
    INDEX `idx_mpart_room` (`room_id`),
    INDEX `idx_mpart_user` (`user_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
