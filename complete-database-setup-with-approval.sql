-- Complete Database Setup Script with Club Approval Workflow
-- Run this script in your Supabase SQL Editor to set up all required tables and admin account

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VOLUNTEER PLATFORM SCHEMA (Migration 001)
-- =====================================================

-- Clubs table (extends existing club functionality)
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  logo_url TEXT,
  website_url TEXT,
  sport_types TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  -- Club approval workflow columns
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  time_commitment TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer profiles table
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  availability TEXT[] DEFAULT '{}',
  profile_image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Messages table for internal communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SPORTS COUNCIL SCHEMA (Migration 002)
-- =====================================================

-- Sports council meetings table
CREATE TABLE IF NOT EXISTS sports_council_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location TEXT,
  agenda TEXT,
  minutes TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sports council administrators table
CREATE TABLE IF NOT EXISTS sports_council_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- ADMIN ROLES SCHEMA (Migration 003)
-- =====================================================

-- Admin roles table for platform administrators
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content reports table for moderation
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('opportunity', 'profile', 'message', 'club')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions table to track admin actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'content_removal', 'account_suspension', 'dismissal')),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'content')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CLUB APPROVAL WORKFLOW SCHEMA (Migration 004)
-- =====================================================

-- Club application history table for tracking approval decisions
CREATE TABLE IF NOT EXISTS club_application_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Volunteer platform indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_club_id ON volunteer_opportunities(club_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_opportunity_id ON volunteer_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_volunteer_id ON volunteer_applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Sports council indexes
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_date ON sports_council_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_status ON sports_council_meetings(status);
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_public ON sports_council_meetings(is_public);
CREATE INDEX IF NOT EXISTS idx_sports_council_admins_email ON sports_council_admins(email);
CREATE INDEX IF NOT EXISTS idx_sports_council_admins_active ON sports_council_admins(is_active);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_admin ON admin_roles(is_admin);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- Club approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_clubs_application_status ON clubs(application_status);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_by ON clubs(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_at ON clubs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_club_application_history_club_id ON club_application_history(club_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_admin_id ON club_application_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_action ON club_application_history(action);
CREATE INDEX IF NOT EXISTS idx_club_application_history_created_at ON club_application_history(created_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_council_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_council_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_application_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Clubs policies (updated for approval workflow)
DROP POLICY IF EXISTS "Anyone can view all clubs" ON clubs;
DROP POLICY IF EXISTS "Anyone can view approved clubs" ON clubs;
CREATE POLICY "Anyone can view approved clubs" ON clubs
  FOR SELECT USING (application_status = 'approved');

DROP POLICY IF EXISTS "Club owners can manage their clubs" ON clubs;
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

-- Volunteer opportunities policies (updated for approval workflow)
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON volunteer_opportunities;
CREATE POLICY "Anyone can view active opportunities from approved clubs" ON volunteer_opportunities
  FOR SELECT USING (
    status = 'active' 
    AND club_id IN (
      SELECT id FROM clubs WHERE application_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Club owners can manage their opportunities" ON volunteer_opportunities;
CREATE POLICY "Club owners can manage their opportunities" ON volunteer_opportunities
  FOR ALL USING (
    club_id IN (
      SELECT id FROM clubs WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

-- Volunteer profiles policies
DROP POLICY IF EXISTS "Volunteers can manage own profile" ON volunteer_profiles;
CREATE POLICY "Volunteers can manage own profile" ON volunteer_profiles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Clubs can view visible volunteer profiles" ON volunteer_profiles;
CREATE POLICY "Clubs can view visible volunteer profiles" ON volunteer_profiles
  FOR SELECT USING (is_visible = true);

-- Volunteer applications policies
DROP POLICY IF EXISTS "Volunteers can manage own applications" ON volunteer_applications;
CREATE POLICY "Volunteers can manage own applications" ON volunteer_applications
  FOR ALL USING (
    volunteer_id IN (
      SELECT id FROM volunteer_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clubs can view applications for their opportunities" ON volunteer_applications;
CREATE POLICY "Clubs can view applications for their opportunities" ON volunteer_applications
  FOR SELECT USING (
    opportunity_id IN (
      SELECT vo.id FROM volunteer_opportunities vo
      JOIN clubs c ON vo.club_id = c.id
      WHERE c.contact_email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Clubs can update applications for their opportunities" ON volunteer_applications;
CREATE POLICY "Clubs can update applications for their opportunities" ON volunteer_applications
  FOR UPDATE USING (
    opportunity_id IN (
      SELECT vo.id FROM volunteer_opportunities vo
      JOIN clubs c ON vo.club_id = c.id
      WHERE c.contact_email = auth.jwt() ->> 'email'
    )
  );

-- Messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- Sports council meetings policies
DROP POLICY IF EXISTS "Anyone can view public meetings" ON sports_council_meetings;
CREATE POLICY "Anyone can view public meetings" ON sports_council_meetings
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Sports council admins can manage all meetings" ON sports_council_meetings;
CREATE POLICY "Sports council admins can manage all meetings" ON sports_council_meetings
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

-- Sports council admins policies
DROP POLICY IF EXISTS "Sports council admins can view admin list" ON sports_council_admins;
CREATE POLICY "Sports council admins can view admin list" ON sports_council_admins
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

DROP POLICY IF EXISTS "Sports council admins can manage admin records" ON sports_council_admins;
CREATE POLICY "Sports council admins can manage admin records" ON sports_council_admins
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

-- Admin roles policies
DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;
CREATE POLICY "Admins can view admin roles" ON admin_roles
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage admin roles" ON admin_roles;
CREATE POLICY "Admins can manage admin roles" ON admin_roles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Content reports policies
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage reports" ON content_reports;
CREATE POLICY "Admins can manage reports" ON content_reports
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Moderation actions policies
DROP POLICY IF EXISTS "Admins can view moderation actions" ON moderation_actions;
CREATE POLICY "Admins can view moderation actions" ON moderation_actions
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can create moderation actions" ON moderation_actions;
CREATE POLICY "Admins can create moderation actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- =====================================================
-- CREATE FUNCTIONS
-- =====================================================

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_volunteer_opportunities_updated_at ON volunteer_opportunities;
CREATE TRIGGER update_volunteer_opportunities_updated_at BEFORE UPDATE ON volunteer_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_volunteer_profiles_updated_at ON volunteer_profiles;
CREATE TRIGGER update_volunteer_profiles_updated_at BEFORE UPDATE ON volunteer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_volunteer_applications_updated_at ON volunteer_applications;
CREATE TRIGGER update_volunteer_applications_updated_at BEFORE UPDATE ON volunteer_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sports_council_meetings_updated_at ON sports_council_meetings;
CREATE TRIGGER update_sports_council_meetings_updated_at BEFORE UPDATE ON sports_council_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sports_council_admins_updated_at ON sports_council_admins;
CREATE TRIGGER update_sports_council_admins_updated_at BEFORE UPDATE ON sports_council_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_reports_updated_at ON content_reports;
CREATE TRIGGER update_content_reports_updated_at BEFORE UPDATE ON content_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin utility functions
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE id = user_id AND is_admin = true
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(user_id UUID, suspension_reason TEXT)
RETURNS VOID AS $
BEGIN
  -- Log the action
  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), 'account_suspension', 'user', user_id, suspension_reason);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION moderate_content(
  content_id UUID, 
  content_type TEXT, 
  moderation_action TEXT, 
  moderation_reason TEXT
)
RETURNS VOID AS $
BEGIN
  -- Log the moderation action
  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), moderation_action, 'content', content_id, moderation_reason);
  
  -- Update any related reports
  UPDATE content_reports 
  SET status = 'resolved', updated_at = NOW()
  WHERE content_id = moderate_content.content_id AND content_type = moderate_content.content_type;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLUB APPROVAL WORKFLOW FUNCTIONS
-- =====================================================

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

DROP TRIGGER IF EXISTS trigger_log_club_status_change ON clubs;
CREATE TRIGGER trigger_log_club_status_change
  AFTER UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION log_club_status_change();

-- Update existing clubs to have 'approved' status if they were previously verified
-- This ensures backward compatibility with existing data
UPDATE clubs 
SET application_status = 'approved' 
WHERE verified = true AND application_status = 'pending';

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample sports council meetings
INSERT INTO sports_council_meetings (title, meeting_date, meeting_time, location, agenda, minutes, status) VALUES
  (
    'Monthly Sports Council Meeting - January 2025',
    '2025-01-15',
    '19:00:00',
    'Community Centre, Main Hall',
    'Review of club applications, budget discussions, upcoming events planning',
    'Meeting called to order at 7:00 PM. Present: John Smith (Chair), Sarah Johnson (Secretary), Mike Brown (Treasurer). Discussed new club applications from Tennis Club and Swimming Club. Budget approved for community sports day. Next meeting scheduled for February 15th.',
    'completed'
  ),
  (
    'Sports Council Meeting - February 2025',
    '2025-02-15',
    '19:00:00',
    'Community Centre, Main Hall',
    'Equipment grants review, volunteer recognition program, summer events planning',
    null,
    'upcoming'
  ),
  (
    'Emergency Sports Council Meeting',
    '2025-03-01',
    '18:30:00',
    'Online via Zoom',
    'Urgent facility maintenance issues, emergency budget allocation',
    null,
    'upcoming'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP ADMIN ACCOUNT
-- =====================================================

-- IMPORTANT: Replace 'your-admin-email@example.com' with your actual email address
-- This email must match the email you used to create your user account in Supabase Auth

-- Insert admin role for your user account
INSERT INTO admin_roles (id, email, is_admin) 
SELECT 
  auth.users.id,
  'your-admin-email@example.com',  -- REPLACE THIS WITH YOUR EMAIL
  true
FROM auth.users 
WHERE auth.users.email = 'your-admin-email@example.com'  -- REPLACE THIS WITH YOUR EMAIL
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  is_admin = true;

-- Insert sports council admin role for your user account
INSERT INTO sports_council_admins (user_id, email, name, is_active)
SELECT 
  auth.users.id,
  'your-admin-email@example.com',  -- REPLACE THIS WITH YOUR EMAIL
  'Platform Administrator',
  true
FROM auth.users 
WHERE auth.users.email = 'your-admin-email@example.com'  -- REPLACE THIS WITH YOUR EMAIL
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_active = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify admin role was created
SELECT 'Admin Role Created:' as status, * FROM admin_roles WHERE email = 'your-admin-email@example.com';

-- Verify sports council admin role was created  
SELECT 'Sports Council Admin Created:' as status, * FROM sports_council_admins WHERE email = 'your-admin-email@example.com';

-- Show all tables created
SELECT 'Tables Created:' as status, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Show club approval workflow is ready
SELECT 'Club Approval Workflow Ready:' as status, 
       COUNT(*) as total_clubs,
       COUNT(CASE WHEN application_status = 'pending' THEN 1 END) as pending_applications,
       COUNT(CASE WHEN application_status = 'approved' THEN 1 END) as approved_clubs,
       COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejected_applications
FROM clubs;