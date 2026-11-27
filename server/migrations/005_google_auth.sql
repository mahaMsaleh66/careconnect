-- Google Sign-In: allow password-less users and store Google subject id.
-- Run once on the existing CareConnect database.

ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NULL;

ALTER TABLE users
  ADD COLUMN google_id VARCHAR(100) NULL UNIQUE;
