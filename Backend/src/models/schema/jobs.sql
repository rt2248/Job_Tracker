CREATE TYPE job_status AS ENUM (
    'applied',
    'oa',
    'interview',
    'offer',
    'accepted',
    'rejected'
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status job_status NOT NULL DEFAULT 'applied',
    applied_date DATE,
    deadline DATE,
    resume_used TEXT,
    notes TEXT,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);