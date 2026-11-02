-- Migration: Stage 6.1 Application Status History & Ownership Integrity
-- File: Backend/src/models/schema/status_history.sql

-- 1. Ensure composite uniqueness on parent jobs table to support composite foreign key
ALTER TABLE jobs
    ADD CONSTRAINT uq_jobs_id_user_id UNIQUE (id, user_id);

-- 2. Create the status history audit table with engine-enforced user ownership
CREATE TABLE IF NOT EXISTS job_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    from_status job_status NULL,
    to_status job_status NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Composite foreign key guarantees that history user_id matches jobs.user_id
    CONSTRAINT fk_status_history_job_user 
        FOREIGN KEY (job_id, user_id) 
        REFERENCES jobs(id, user_id) 
        ON DELETE CASCADE,

    -- Direct reference to users table for clean cascading on user deletion
    CONSTRAINT fk_status_history_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 3. Dedicated indexes for chronologically ordered timeline queries and user analytics
CREATE INDEX IF NOT EXISTS idx_status_history_job_timeline 
    ON job_status_history(job_id, changed_at ASC);

CREATE INDEX IF NOT EXISTS idx_status_history_user_analytics 
    ON job_status_history(user_id, to_status, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_changed_at 
    ON job_status_history(changed_at DESC);
