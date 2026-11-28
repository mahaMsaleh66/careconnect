-- Payment receipt screenshot + admin verification status on donations.
-- Safe to re-run: adds columns only if they are missing.

SET @db = DATABASE();

SET @has_receipt_image = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'donations' AND COLUMN_NAME = 'receipt_image'
);
SET @sql = IF(
  @has_receipt_image = 0,
  'ALTER TABLE donations ADD COLUMN receipt_image VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_status = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'donations' AND COLUMN_NAME = 'status'
);
SET @sql = IF(
  @has_status = 0,
  'ALTER TABLE donations ADD COLUMN status ENUM(''Pending'', ''Verified'', ''Rejected'') NOT NULL DEFAULT ''Pending''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
