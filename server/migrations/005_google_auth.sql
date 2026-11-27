-- Google Sign-In: allow password-less users and store Google subject id.
-- Safe to re-run: password NULL is idempotent; google_id is added only if missing.

ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NULL;

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(100) NULL UNIQUE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
