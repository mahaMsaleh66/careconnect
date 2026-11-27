-- Persistent chat history for the Urdu/Roman-Urdu help assistant.
-- Safe to run on an existing database (CREATE TABLE IF NOT EXISTS).

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
