-- Admin Account Setup Script
-- Run this script in your Supabase SQL editor after creating your admin user account

-- Step 1: First, create a user account in Supabase Auth dashboard with your email
-- Step 2: Replace 'your-admin-email@example.com' below with your actual email
-- Step 3: Run this script in the Supabase SQL editor

-- Insert admin role for your user account
-- Replace 'your-admin-email@example.com' with your actual email address
INSERT INTO admin_roles (id, email, is_admin) 
SELECT 
  auth.users.id,
  'eddie@thevermeers.co.uk',
  true
FROM auth.users 
WHERE auth.users.email = 'eddie@thevermeers.co.uk'
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  is_admin = true;

-- Verify the admin role was created
SELECT * FROM admin_roles WHERE email = 'eddie@thevermeers.co.uk';

-- Optional: Create a sports council admin role as well
-- (This gives you access to the sports council admin panel)
INSERT INTO sports_council_admins (user_id, email, name, is_active)
SELECT 
  auth.users.id,
  'eddie@thevermeers.co.uk',
  'Platform Administrator',
  true
FROM auth.users 
WHERE auth.users.email = 'eddie@thevermeers.co.uk'
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_active = true;

-- Verify the sports council admin role was created
SELECT * FROM sports_council_admins WHERE email = 'eddie@thevermeers.co.uk';