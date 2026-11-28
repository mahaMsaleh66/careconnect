-- Optional donor note / transaction reference on donations.
-- Existing rows stay NULL. Safe to re-run if schema.sql already added `note`.

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'donations' AND COLUMN_NAME = 'note'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE donations ADD COLUMN note VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
