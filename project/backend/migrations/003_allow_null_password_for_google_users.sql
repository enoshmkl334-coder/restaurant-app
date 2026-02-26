-- Migration: Allow NULL passwords for Google OAuth users
-- Date: 2025-02-25
-- Purpose: Google users don't have passwords, so we need to allow NULL

-- Step 1: Modify the password column to allow NULL
ALTER TABLE user 
MODIFY COLUMN password VARCHAR(255) NULL;

-- Step 2: Verify the change
DESCRIBE user;

-- Expected result: password column should show "YES" in the Null column
