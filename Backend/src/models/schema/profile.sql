-- User Profiles Table
-- Integrates with existing users table, preserving all existing user records and relationships.
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    location TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    portfolio_url TEXT DEFAULT NULL,
    github_url TEXT DEFAULT NULL,
    linkedin_url TEXT DEFAULT NULL,
    twitter_url TEXT DEFAULT NULL,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public_profile BOOLEAN NOT NULL DEFAULT FALSE,
    visibility_settings JSONB NOT NULL DEFAULT '{
        "email": false,
        "resume": false,
        "location": false,
        "headline": true,
        "bio": true,
        "avatar": true,
        "portfolio": true,
        "socialLinks": true,
        "skills": true,
        "experience": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id foreign key for fast single-user lookups and joins
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Ensure column default matches privacy-first policy for existing installations
ALTER TABLE user_profiles 
ALTER COLUMN visibility_settings 
SET DEFAULT '{
    "email": false,
    "resume": false,
    "location": false,
    "headline": true,
    "bio": true,
    "avatar": true,
    "portfolio": true,
    "socialLinks": true,
    "skills": true,
    "experience": true
}'::jsonb;
