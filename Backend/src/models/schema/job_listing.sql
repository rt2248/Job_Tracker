CREATE TYPE experience_level_enum AS ENUM ('entry', 'mid', 'senior');

CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type job_type_enum NOT NULL,
    work_mode work_mode_enum NOT NULL,
    experience_level experience_level_enum NOT NULL,
    compensation_min NUMERIC,
    compensation_max NUMERIC,
    compensation_period compensation_period_enum,
    compensation_currency TEXT DEFAULT 'INR',
    posted_date DATE NOT NULL,
    description TEXT,
    requirements TEXT[],
    link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE listing_tags (
    listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, tag_id)
);