-- Optional donor note / transaction reference on donations.
-- Existing rows stay NULL. Run once on the local CareConnect database.

ALTER TABLE donations
  ADD COLUMN note VARCHAR(255) NULL;
