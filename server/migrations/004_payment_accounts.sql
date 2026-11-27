-- Official receiving accounts (JazzCash, Easypaisa, Bank).
-- Safe to run on an existing database (CREATE TABLE IF NOT EXISTS).

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
