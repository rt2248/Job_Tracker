-- Migration Rollback: Stage 6.1 Application Status History
-- File: Backend/src/models/schema/status_history_rollback.sql

-- 1. Drop the status history table (automatically drops fk_status_history_job_user and idx_*)
DROP TABLE IF EXISTS job_status_history CASCADE;

-- 2. Drop ONLY the composite unique constraint introduced by this migration
-- Pre-existing primary key (id) and foreign key (user_id -> users.id) remain intact
ALTER TABLE jobs
    DROP CONSTRAINT IF EXISTS uq_jobs_id_user_id;
