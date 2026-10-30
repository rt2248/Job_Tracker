-- Rollback Migration: Stage 5.1 Account Security Foundation
-- Drops token_version and password_changed_at from users table.

ALTER TABLE users 
DROP COLUMN IF EXISTS token_version,
DROP COLUMN IF EXISTS password_changed_at;
