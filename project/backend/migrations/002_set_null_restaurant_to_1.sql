-- Migration: Set all NULL user.restaurant_id to 1 (safe, ready-to-run)
-- IMPORTANT: BACKUP your DB before running any migration.
-- Example: mysqldump -u root -p rom user > user_backup.sql

-- 1) Quick check: ensure restaurant id 1 exists
SELECT id, restaurant FROM restaurants WHERE id = 1;

-- If the above SELECT returns no rows, DO NOT RUN the UPDATE below; change the target id accordingly.

-- 2) Run the change inside a transaction
START TRANSACTION;

-- Update users with NULL restaurant_id to 1
UPDATE `user`
SET restaurant_id = 1
WHERE restaurant_id IS NULL;

-- Verification queries
SELECT COUNT(*) AS remaining_nulls FROM `user` WHERE restaurant_id IS NULL;
SELECT COUNT(*) AS assigned_to_1 FROM `user` WHERE restaurant_id = 1;

-- If verification looks good, commit. If not, ROLLBACK.
-- COMMIT;   -- Uncomment to commit automatically
-- ROLLBACK; -- Uncomment to rollback

-- NOTE: By default this script leaves the transaction open so you can inspect results and then issue COMMIT or ROLLBACK as you prefer.
