-- Add is_active to existing users tables.
-- Existing rows receive is_active = 1 via the DEFAULT.
-- Run once against the local CareConnect database.

ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
