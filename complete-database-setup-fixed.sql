-- Complete Database Setup Script - FIXED VERSION
-- Run this script in your Supabase SQL Editor to set up all required tables and admin account

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE ALL TABLES FIRST (WITHOUT RLS POLICIES)
-- =====================================================

-- Clubs table
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

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Admin roles table - CREATE THIS FIRST
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content reports table
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

-- Moderation actions table
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
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_club_id ON volunteer_opportunities(club_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_opportunity_id ON volunteer_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_volunteer_id ON volunteer_applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_date ON sports_council_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_status ON sports_council_meetings(status);
CREATE INDEX IF NOT EXISTS idx_sports_council_meetings_public ON sports_council_meetings(is_public);
CREATE INDEX IF NOT EXISTS idx_sports_council_admins_email ON sports_council_admins(email);
CREATE INDEX IF NOT EXISTS idx_sports_council_admins_active ON sports_council_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_admin ON admin_roles(is_admin);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- =====================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- SETUP ADMIN ACCOUNT (REPLACE EMAIL ADDRESSES)
-- =====================================================

-- IMPORTANT: Replace 'your-admin-email@example.com' with your actual email address

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
-- ENABLE ROW LEVEL SECURITY AND CREATE POLICIES
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

-- Simple policies that don't create circular dependencies
DROP POLICY IF EXISTS "Anyone can view all clubs" ON clubs;
CREATE POLICY "Anyone can view all clubs" ON clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert clubs" ON clubs;
CREATE POLICY "Anyone can insert clubs" ON clubs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view opportunities" ON volunteer_opportunities;
CREATE POLICY "Anyone can view opportunities" ON volunteer_opportunities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view profiles" ON volunteer_profiles;
CREATE POLICY "Anyone can view profiles" ON volunteer_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own profile" ON volunteer_profiles;
CREATE POLICY "Users can manage own profile" ON volunteer_profiles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view applications" ON volunteer_applications;
CREATE POLICY "Anyone can view applications" ON volunteer_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create applications" ON volunteer_applications;
CREATE POLICY "Users can create applications" ON volunteer_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view meetings" ON sports_council_meetings;
CREATE POLICY "Anyone can view meetings" ON sports_council_meetings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view sports council admins" ON sports_council_admins;
CREATE POLICY "Anyone can view sports council admins" ON sports_council_admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view admin roles" ON admin_roles;
CREATE POLICY "Anyone can view admin roles" ON admin_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view reports" ON content_reports;
CREATE POLICY "Anyone can view reports" ON content_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view moderation actions" ON moderation_actions;
CREATE POLICY "Anyone can view moderation actions" ON moderation_actions FOR SELECT USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SELECT 'Tables Created:' as status, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verify admin role was created (will show results after you replace the email)
SELECT 'Admin Role Status:' as status, 
       CASE WHEN EXISTS(SELECT 1 FROM admin_roles WHERE email = 'your-admin-email@example.com') 
            THEN 'Admin role exists' 
            ELSE 'Admin role not found - make sure to replace email address' 
       END as message;

-- Show sample of created data
SELECT 'Sample Data:' as status, COUNT(*) as meeting_count FROM sports_council_meetings;