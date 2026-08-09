CREATE DATABASE job_tracker;

CREATE TABLE users(
    id UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);