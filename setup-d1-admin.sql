-- D1 Admin Setup Script
-- Run this after creating your D1 database to set up the first admin account

-- Replace these values with your actual admin details
-- IMPORTANT: Change these before running!

INSERT INTO users (id, email, password_hash, email_verified) 
VALUES (
  'admin-001', 
  'admin@yourdomain.com',  -- CHANGE THIS TO YOUR EMAIL
  '$2b$10$example.hash.here',  -- CHANGE THIS TO A PROPER BCRYPT HASH
  1
);

INSERT INTO admin_roles (id, user_id, email, is_admin) 
VALUES (
  'admin-role-001',
  'admin-001', 
  'admin@yourdomain.com',  -- CHANGE THIS TO YOUR EMAIL
  1
);

-- Verify the admin account was created
SELECT 'Admin user created:' as status, * FROM users WHERE email = 'admin@yourdomain.com';
SELECT 'Admin role created:' as status, * FROM admin_roles WHERE email = 'admin@yourdomain.com';

-- Show all tables in the database
SELECT 'Database tables:' as status, name FROM sqlite_master WHERE type='table' ORDER BY name;