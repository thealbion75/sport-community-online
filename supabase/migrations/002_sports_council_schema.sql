-- Sports Council Meeting Management Schema
-- This migration creates tables for sports council meeting management

-- Sports council meetings table
CREATE TABLE sports_council_meetings (
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
CREATE TABLE sports_council_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sports_council_meetings_date ON sports_council_meetings(meeting_date DESC);
CREATE INDEX idx_sports_council_meetings_status ON sports_council_meetings(status);
CREATE INDEX idx_sports_council_meetings_public ON sports_council_meetings(is_public);
CREATE INDEX idx_sports_council_admins_email ON sports_council_admins(email);
CREATE INDEX idx_sports_council_admins_active ON sports_council_admins(is_active);

-- Row Level Security Policies

-- Enable RLS on sports council tables
ALTER TABLE sports_council_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_council_admins ENABLE ROW LEVEL SECURITY;

-- Sports council meetings policies
CREATE POLICY "Anyone can view public meetings" ON sports_council_meetings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Sports council admins can manage all meetings" ON sports_council_meetings
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

-- Sports council admins policies
CREATE POLICY "Sports council admins can view admin list" ON sports_council_admins
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

CREATE POLICY "Sports council admins can manage admin records" ON sports_council_admins
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM sports_council_admins WHERE is_active = true
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_sports_council_meetings_updated_at BEFORE UPDATE ON sports_council_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sports_council_admins_updated_at BEFORE UPDATE ON sports_council_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO sports_council_admins (user_id, email, name) VALUES
  (uuid_generate_v4(), 'admin@sportscouncil.local', 'Sports Council Administrator');

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
  );