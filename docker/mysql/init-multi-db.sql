-- LawinoMeet Multi-Database Initialization Script for Docker MySQL 8
-- Automatically executed upon container first run from /docker-entrypoint-initdb.d/

CREATE DATABASE IF NOT EXISTS `auth_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `appointment_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `meeting_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `chat_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions to default application user
CREATE USER IF NOT EXISTS 'lawino_user'@'%' IDENTIFIED BY 'lawino_password';
GRANT ALL PRIVILEGES ON `auth_db`.* TO 'lawino_user'@'%';
GRANT ALL PRIVILEGES ON `user_db`.* TO 'lawino_user'@'%';
GRANT ALL PRIVILEGES ON `appointment_db`.* TO 'lawino_user'@'%';
GRANT ALL PRIVILEGES ON `meeting_db`.* TO 'lawino_user'@'%';
GRANT ALL PRIVILEGES ON `notification_db`.* TO 'lawino_user'@'%';
GRANT ALL PRIVILEGES ON `chat_db`.* TO 'lawino_user'@'%';

FLUSH PRIVILEGES;
