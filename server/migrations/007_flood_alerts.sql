-- Flood alert desk: admin-issued Sindh/Pakistan flood warnings with map pins.
-- Safe to re-run. Aligns created_by with users.id before adding the FK
-- so ERROR 3780 cannot occur on mixed SIGNED/UNSIGNED databases.

SET @db := DATABASE();

CREATE TABLE IF NOT EXISTS flood_alerts (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  district VARCHAR(100) NOT NULL,
  severity ENUM('Advisory', 'Warning', 'Emergency') NOT NULL DEFAULT 'Warning',
  water_level VARCHAR(100) NULL,
  description TEXT NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  status ENUM('Active', 'Resolved') NOT NULL DEFAULT 'Active',
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_flood_alerts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'
);
SET @sql := IF(@id_type IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE flood_alerts MODIFY COLUMN created_by ', @id_type, ' NULL'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'flood_alerts'
    AND CONSTRAINT_NAME = 'fk_flood_alerts_created_by'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE flood_alerts ADD CONSTRAINT fk_flood_alerts_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
