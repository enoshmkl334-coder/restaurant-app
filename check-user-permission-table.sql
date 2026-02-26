-- Check if user_permission table exists and its structure
SHOW TABLES LIKE 'user_permission';

-- If it exists, show its structure
DESCRIBE user_permission;

-- Show sample data
SELECT * FROM user_permission LIMIT 5;

-- Check if all users have permissions
SELECT 
  u.id,
  u.username,
  up.permission
FROM user u
LEFT JOIN user_permission up ON u.id = up.userId
LIMIT 10;
