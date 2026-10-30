-- Migration: Stage 5.1 Account Security Foundation
-- Adds token_version and password_changed_at to users table for session invalidation and audit tracking.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL;
