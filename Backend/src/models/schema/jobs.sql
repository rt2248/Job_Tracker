CREATE TYPE job_status AS ENUM (
    'applied',
    'oa',
    'interview',
    'offer',
    'accepted',
    'rejected'
);

CREATE TYPE job_type_enum AS ENUM ('internship', 'fulltime', 'parttime', 'contract');
CREATE TYPE work_mode_enum AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE compensation_period_enum AS ENUM ('monthly', 'yearly');

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_type job_type_enum NOT NULL DEFAULT 'fulltime',
    work_mode work_mode_enum,
    compensation_min NUMERIC,
    compensation_max NUMERIC,
    compensation_period compensation_period_enum,
    compensation_currency TEXT DEFAULT 'INR'
);