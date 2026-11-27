-- CareConnect MySQL schema
-- Safe to run on an existing database: CREATE TABLE IF NOT EXISTS only.
-- Does not DROP tables, so local test data is kept.
--
--   mysql -u root -p careconnect < server/schema.sql
--
-- Types and defaults are inferred from server/routes/*.js and createAdmin.js.
-- Charset utf8mb4 is required for Urdu help-request messages and AI replies.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  role VARCHAR(20) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  google_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- volunteer_profiles.user_id is UNIQUE so PUT /volunteers/me can use
-- INSERT ... ON DUPLICATE KEY UPDATE.
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  user_id INT UNSIGNED NOT NULL,
  skills VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  availability VARCHAR(20) NOT NULL DEFAULT 'Available',
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_volunteer_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crises (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) DEFAULT NULL,
  location VARCHAR(150) DEFAULT NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  affected_people INT NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'Low',
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crises_status (status),
  CONSTRAINT fk_crises_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS help_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  needy_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  need_type VARCHAR(50) NOT NULL DEFAULT 'Other',
  urgency VARCHAR(20) NOT NULL DEFAULT 'Low',
  city VARCHAR(100) DEFAULT NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_help_requests_status (status),
  CONSTRAINT fk_help_requests_needy
    FOREIGN KEY (needy_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  donor_id INT UNSIGNED NOT NULL,
  crisis_id INT UNSIGNED DEFAULT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  receipt_no VARCHAR(40) NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  receipt_image VARCHAR(255) NULL,
  status ENUM('Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_donations_receipt_no (receipt_no),
  KEY idx_donations_donor (donor_id),
  CONSTRAINT fk_donations_donor
    FOREIGN KEY (donor_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_donations_crisis
    FOREIGN KEY (crisis_id) REFERENCES crises (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id INT UNSIGNED NOT NULL,
  volunteer_id INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Assigned',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_volunteer (volunteer_id),
  CONSTRAINT fk_tasks_request
    FOREIGN KEY (request_id) REFERENCES help_requests (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_volunteer
    FOREIGN KEY (volunteer_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  headline VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Irrelevant',
  is_relevant TINYINT(1) NOT NULL DEFAULT 0,
  url VARCHAR(500) DEFAULT NULL,
  source VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_items_headline (headline),
  KEY idx_news_items_relevant (is_relevant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_feedback_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  sender VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  detected_need VARCHAR(50) DEFAULT NULL,
  detected_urgency VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_messages_user (user_id, created_at),
  CONSTRAINT fk_chat_messages_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_accounts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  method ENUM('JazzCash', 'Easypaisa', 'Bank') NOT NULL,
  account_title VARCHAR(120) NOT NULL,
  account_number VARCHAR(80) NOT NULL,
  bank_name VARCHAR(120) DEFAULT NULL,
  instructions VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payment_accounts_active (is_active, method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS flood_alerts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  district VARCHAR(100) NOT NULL,
  severity ENUM('Advisory', 'Warning', 'Emergency') NOT NULL DEFAULT 'Warning',
  water_level VARCHAR(100) NULL,
  description TEXT NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  status ENUM('Active', 'Resolved') NOT NULL DEFAULT 'Active',
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_flood_alerts_status (status),
  CONSTRAINT fk_flood_alerts_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
