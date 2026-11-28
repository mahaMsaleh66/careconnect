-- Map pins: latitude / longitude on crises, help requests, and volunteer profiles.
-- Safe to re-run: adds lat/lng only when the column is missing.

SET @db := DATABASE();

-- crises.lat
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crises' AND COLUMN_NAME = 'lat'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE crises ADD COLUMN lat DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- crises.lng
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crises' AND COLUMN_NAME = 'lng'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE crises ADD COLUMN lng DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- help_requests.lat
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'help_requests' AND COLUMN_NAME = 'lat'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE help_requests ADD COLUMN lat DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- help_requests.lng
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'help_requests' AND COLUMN_NAME = 'lng'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE help_requests ADD COLUMN lng DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- volunteer_profiles.lat
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'volunteer_profiles' AND COLUMN_NAME = 'lat'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE volunteer_profiles ADD COLUMN lat DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- volunteer_profiles.lng
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'volunteer_profiles' AND COLUMN_NAME = 'lng'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE volunteer_profiles ADD COLUMN lng DECIMAL(10, 7) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
