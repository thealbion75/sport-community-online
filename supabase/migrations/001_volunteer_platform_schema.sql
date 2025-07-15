-- Volunteer Sports Platform Database Schema
-- This migration creates the core tables for the volunteer platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer opportunities table
CREATE TABLE volunteer_opportunities (
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
CREATE TABLE volunteer_profiles (
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
CREATE TABLE volunteer_applications (
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
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_volunteer_opportunities_club_id ON volunteer_opportunities(club_id);
CREATE INDEX idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX idx_volunteer_applications_opportunity_id ON volunteer_applications(opportunity_id);
CREATE INDEX idx_volunteer_applications_volunteer_id ON volunteer_applications(volunteer_id);
CREATE INDEX idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(read);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Clubs policies
CREATE POLICY "Anyone can view verified clubs" ON clubs
  FOR SELECT USING (verified = true);

CREATE POLICY "Club owners can manage their clubs" ON clubs
  FOR ALL USING (contact_email = auth.jwt() ->> 'email');

-- Volunteer opportunities policies
CREATE POLICY "Anyone can view active opportunities" ON volunteer_opportunities
  FOR SELECT USING (status = 'active');

CREATE POLICY "Club owners can manage their opportunities" ON volunteer_opportunities
  FOR ALL USING (
    club_id IN (
      SELECT id FROM clubs WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

-- Volunteer profiles policies
CREATE POLICY "Volunteers can manage own profile" ON volunteer_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Clubs can view visible volunteer profiles" ON volunteer_profiles
  FOR SELECT USING (is_visible = true);

-- Volunteer applications policies
CREATE POLICY "Volunteers can manage own applications" ON volunteer_applications
  FOR ALL USING (
    volunteer_id IN (
      SELECT id FROM volunteer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clubs can view applications for their opportunities" ON volunteer_applications
  FOR SELECT USING (
    opportunity_id IN (
      SELECT vo.id FROM volunteer_opportunities vo
      JOIN clubs c ON vo.club_id = c.id
      WHERE c.contact_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Clubs can update applications for their opportunities" ON volunteer_applications
  FOR UPDATE USING (
    opportunity_id IN (
      SELECT vo.id FROM volunteer_opportunities vo
      JOIN clubs c ON vo.club_id = c.id
      WHERE c.contact_email = auth.jwt() ->> 'email'
    )
  );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_opportunities_updated_at BEFORE UPDATE ON volunteer_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_profiles_updated_at BEFORE UPDATE ON volunteer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_applications_updated_at BEFORE UPDATE ON volunteer_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();