-- =========================================================================
-- LawinoMeet Multi-Microservice Database Initialization for AWS RDS
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
