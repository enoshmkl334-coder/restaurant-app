-- Migration: Update existing Google users to show proper names
-- Date: 2025-02-25
-- Purpose: Existing Google users have email as username, this is optional to clean up

-- This is OPTIONAL - only run if you want to clean up existing Google users
-- You can also just delete the Google user and sign up again

-- Example: Update a specific user's name
-- UPDATE user SET username = 'Your Name' WHERE google_id = 'your-google-id';

-- Or you can just delete the Google user and sign up again:
-- DELETE FROM user WHERE google_id IS NOT NULL;

-- After running this, sign up with Google again and it will use your proper name
