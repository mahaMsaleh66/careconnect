-- Flood alert desk: admin-issued Sindh/Pakistan flood warnings with map pins.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS.

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
