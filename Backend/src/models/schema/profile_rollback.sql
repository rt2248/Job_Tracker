-- Rollback migration for User Profiles Table
-- WARNING: Executing this rollback permanently drops the 'user_profiles' table and erases all stored developer profile data.
-- Core authentication user records ('users') and resume files/metadata ('user_resumes') are preserved.
DROP TABLE IF EXISTS user_profiles CASCADE;
