-- D1 Admin Setup Script
-- Run this after creating your D1 database to set up the first admin account

-- Replace these values with your actual admin details
-- IMPORTANT: Change these before running!

INSERT INTO users (id, email, password_hash, email_verified) 
VALUES (
  'admin-001', 
  'admin@themainhost.co.uk',
  '$2b$10$d0997b34df061bcece5ee0864abcbaa16aa3413c9884aefd0f869fb5ad1868c73d7259bab0fbd01c3571168a4fa001bfa0f1d38c44a437d01358235e5134e37082abbbe719ddcf048e0221691355abb4',  -- CHANGE THIS TO YOUR EMAIL  -- Password hash for: TheW4sps!
  1
);

INSERT INTO admin_roles (id, user_id, email, is_admin) 
VALUES (
  'admin-role-001',
  'admin-001', 
  'admin@themainhost.co.uk',  -- CHANGE THIS TO YOUR EMAIL
  1
);

-- Verify the admin account was created
SELECT 'Admin user created:' as status, * FROM users WHERE email = 'admin@themainhost.co.uk';
SELECT 'Admin role created:' as status, * FROM admin_roles WHERE email = 'admin@themainhost.co.uk';

-- Show all tables in the database
SELECT 'Database tables:' as status, name FROM sqlite_master WHERE type='table' ORDER BY name;