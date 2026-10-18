-- Add to Tracker feature migration

-- 1. New status for jobs the user is interested in but hasn't applied to.
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'saved' BEFORE 'applied';

-- 2. Remember which listing a tracked job came from 
ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS source_listing_id UUID
    REFERENCES job_listings(id) ON DELETE SET NULL;

-- 3. DB-level guard against double-adding the same listing
CREATE UNIQUE INDEX IF NOT EXISTS jobs_user_source_listing_uniq
    ON jobs (user_id, source_listing_id)
    WHERE source_listing_id IS NOT NULL;

-- 4. Global preference: return-triggered prompts, ON by default.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS return_prompts_enabled BOOLEAN NOT NULL DEFAULT TRUE;