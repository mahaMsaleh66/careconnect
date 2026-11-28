-- Persistent chat history for the Urdu/Roman-Urdu help assistant.
-- Safe to re-run. Aligns user_id with users.id (type + sign + collation)
-- before adding fk_chat_messages_user so ERROR 3780 cannot occur.

SET @db := DATABASE();

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  sender VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  detected_need VARCHAR(50) DEFAULT NULL,
  detected_urgency VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_messages_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Match chat_messages.user_id to users.id exactly (INT vs INT UNSIGNED, etc.).
SET @id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'
);
SET @sql := IF(@id_type IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE chat_messages MODIFY COLUMN user_id ', @id_type, ' NOT NULL'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Keep table collation in sync with users (INT FKs ignore this; string safety).
SET @users_collation := (
  SELECT TABLE_COLLATION FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users'
);
SET @chat_collation := (
  SELECT TABLE_COLLATION FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'chat_messages'
);
SET @sql := IF(
  @users_collation IS NULL OR @users_collation = @chat_collation,
  'SELECT 1',
  CONCAT('ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE ', @users_collation)
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the foreign key only when it is missing.
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'chat_messages'
    AND CONSTRAINT_NAME = 'fk_chat_messages_user'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
