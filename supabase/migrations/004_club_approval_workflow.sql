-- Club Approval Workflow Schema Extensions
-- This migration adds the necessary schema changes for admin club approval functionality

-- Add new columns to clubs table for approval workflow
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending' 
  CHECK (application_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create club_application_history table for tracking approval decisions
CREATE TABLE IF NOT EXISTS club_application_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add database indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_clubs_application_status ON clubs(application_status);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_by ON clubs(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_at ON clubs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_club_application_history_club_id ON club_application_history(club_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_admin_id ON club_application_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_action ON club_application_history(action);
CREATE INDEX IF NOT EXISTS idx_club_application_history_created_at ON club_application_history(created_at);

-- Enable RLS on the new table
ALTER TABLE club_application_history ENABLE ROW LEVEL SECURITY;

-- Update Row Level Security policies to handle pending applications

-- Drop existing clubs policies to recreate them with approval workflow support
DROP POLICY IF EXISTS "Anyone can view verified clubs" ON clubs;
DROP POLICY IF EXISTS "Club owners can manage their clubs" ON clubs;

-- New clubs policies that consider application status
CREATE POLICY "Anyone can view approved clubs" ON clubs
  FOR SELECT USING (application_status = 'approved');

CREATE POLICY "Club owners can view their own clubs" ON clubs
  FOR SELECT USING (contact_email = auth.jwt() ->> 'email');

CREATE POLICY "Club owners can update their own clubs" ON clubs
  FOR UPDATE USING (
    contact_email = auth.jwt() ->> 'email' 
    AND application_status != 'approved' -- Prevent approved clubs from self-editing critical fields
  );

CREATE POLICY "Club owners can insert new clubs" ON clubs
  FOR INSERT WITH CHECK (contact_email = auth.jwt() ->> 'email');

-- Admin policies for club management
CREATE POLICY "Admins can view all clubs" ON clubs
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can manage all clubs" ON clubs
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Club application history policies
CREATE POLICY "Admins can view application history" ON club_application_history
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can create application history" ON club_application_history
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Club owners can view their own application history
CREATE POLICY "Club owners can view their application history" ON club_application_history
  FOR SELECT USING (
    club_id IN (
      SELECT id FROM clubs WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

-- Update volunteer opportunities policies to only show opportunities from approved clubs
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON volunteer_opportunities;

CREATE POLICY "Anyone can view active opportunities from approved clubs" ON volunteer_opportunities
  FOR SELECT USING (
    status = 'active' 
    AND club_id IN (
      SELECT id FROM clubs WHERE application_status = 'approved'
    )
  );

-- Functions for club approval workflow

-- Function to approve a club application
CREATE OR REPLACE FUNCTION approve_club_application(
  club_id_param UUID,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS VOID AS $
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the current admin user ID
  admin_user_id := auth.uid();
  
  -- Verify the user is an admin
  IF NOT is_platform_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update the club status
  UPDATE clubs 
  SET 
    application_status = 'approved',
    admin_notes = admin_notes_param,
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = club_id_param;
  
  -- Log the approval in history
  INSERT INTO club_application_history (club_id, admin_id, action, notes)
  VALUES (club_id_param, admin_user_id, 'approved', admin_notes_param);
  
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a club application
CREATE OR REPLACE FUNCTION reject_club_application(
  club_id_param UUID,
  rejection_reason TEXT
)
RETURNS VOID AS $
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the current admin user ID
  admin_user_id := auth.uid();
  
  -- Verify the user is an admin
  IF NOT is_platform_admin(admin_user_id) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Rejection reason is required
  IF rejection_reason IS NULL OR LENGTH(TRIM(rejection_reason)) = 0 THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;
  
  -- Update the club status
  UPDATE clubs 
  SET 
    application_status = 'rejected',
    admin_notes = rejection_reason,
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = club_id_param;
  
  -- Log the rejection in history
  INSERT INTO club_application_history (club_id, admin_id, action, notes)
  VALUES (club_id_param, admin_user_id, 'rejected', rejection_reason);
  
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending club applications with admin details
CREATE OR REPLACE FUNCTION get_pending_club_applications()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  website_url TEXT,
  sport_types TEXT[],
  application_status TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  -- Verify the user is an admin
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.location,
    c.contact_email,
    c.contact_phone,
    c.logo_url,
    c.website_url,
    c.sport_types,
    c.application_status,
    c.admin_notes,
    c.reviewed_by,
    c.reviewed_at,
    c.created_at,
    c.updated_at
  FROM clubs c
  WHERE c.application_status = 'pending'
  ORDER BY c.created_at ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get club application history with admin details
CREATE OR REPLACE FUNCTION get_club_application_history(club_id_param UUID)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  -- Verify the user is an admin or the club owner
  IF NOT (
    is_platform_admin() OR 
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = club_id_param 
      AND clubs.contact_email = auth.jwt() ->> 'email'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges or club ownership required';
  END IF;
  
  RETURN QUERY
  SELECT 
    h.id,
    h.club_id,
    h.admin_id,
    ar.email as admin_email,
    h.action,
    h.notes,
    h.created_at
  FROM club_application_history h
  LEFT JOIN admin_roles ar ON h.admin_id = ar.id
  WHERE h.club_id = club_id_param
  ORDER BY h.created_at DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing clubs to have 'approved' status if they were previously verified
-- This ensures backward compatibility with existing data
UPDATE clubs 
SET application_status = 'approved' 
WHERE verified = true AND application_status = 'pending';

-- Create a trigger to automatically log status changes
CREATE OR REPLACE FUNCTION log_club_status_change()
RETURNS TRIGGER AS $
BEGIN
  -- Only log if application_status actually changed
  IF OLD.application_status IS DISTINCT FROM NEW.application_status THEN
    INSERT INTO club_application_history (club_id, admin_id, action, notes)
    VALUES (
      NEW.id, 
      NEW.reviewed_by, 
      NEW.application_status, 
      NEW.admin_notes
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_club_status_change
  AFTER UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION log_club_status_change();