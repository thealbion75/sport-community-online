-- Cloudflare D1 Database Schema
-- SQLite version of the sports community platform

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table with approval workflow
CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  logo_url TEXT,
  website_url TEXT,
  sport_types TEXT, -- JSON array as TEXT in SQLite
  verified BOOLEAN DEFAULT FALSE,
  -- Club approval workflow columns
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT, -- JSON array as TEXT
  time_commitment TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer profiles table
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT, -- JSON array as TEXT
  availability TEXT, -- JSON array as TEXT
  profile_image_url TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer applications table
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  volunteer_id TEXT NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(opportunity_id, volunteer_id)
);

-- Messages table for internal communication
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Club application history table for tracking approval decisions
CREATE TABLE IF NOT EXISTS club_application_history (
  id TEXT PRIMARY KEY,
  club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE, -- Allow NULL for bulk operations
  admin_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending', 'bulk_approve_start', 'bulk_approve_complete', 'bulk_approve_error')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);

-- Club indexes
CREATE INDEX IF NOT EXISTS idx_clubs_contact_email ON clubs(contact_email);
CREATE INDEX IF NOT EXISTS idx_clubs_verified ON clubs(verified);
CREATE INDEX IF NOT EXISTS idx_clubs_application_status ON clubs(application_status);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_by ON clubs(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_clubs_reviewed_at ON clubs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON clubs(created_at);

-- Opportunity indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_club_id ON volunteer_opportunities(club_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON volunteer_opportunities(created_at);

-- Volunteer profile indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user_id ON volunteer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_email ON volunteer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_is_visible ON volunteer_profiles(is_visible);

-- Application indexes
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON volunteer_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_volunteer_id ON volunteer_applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON volunteer_applications(applied_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- History indexes
CREATE INDEX IF NOT EXISTS idx_club_application_history_club_id ON club_application_history(club_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_admin_id ON club_application_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_club_application_history_action ON club_application_history(action);
CREATE INDEX IF NOT EXISTS idx_club_application_history_created_at ON club_application_history(created_at);
-- Index for bulk operations (where club_id is NULL)
CREATE INDEX IF NOT EXISTS idx_club_application_history_bulk_ops ON club_application_history(admin_id, action, created_at) WHERE club_id IS NULL;

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Users trigger
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Admin roles trigger
CREATE TRIGGER IF NOT EXISTS update_admin_roles_updated_at 
  AFTER UPDATE ON admin_roles
  FOR EACH ROW
  BEGIN
    UPDATE admin_roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Clubs trigger
CREATE TRIGGER IF NOT EXISTS update_clubs_updated_at 
  AFTER UPDATE ON clubs
  FOR EACH ROW
  BEGIN
    UPDATE clubs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Opportunities trigger
CREATE TRIGGER IF NOT EXISTS update_opportunities_updated_at 
  AFTER UPDATE ON volunteer_opportunities
  FOR EACH ROW
  BEGIN
    UPDATE volunteer_opportunities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Volunteer profiles trigger
CREATE TRIGGER IF NOT EXISTS update_volunteer_profiles_updated_at 
  AFTER UPDATE ON volunteer_profiles
  FOR EACH ROW
  BEGIN
    UPDATE volunteer_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Applications trigger
CREATE TRIGGER IF NOT EXISTS update_applications_updated_at 
  AFTER UPDATE ON volunteer_applications
  FOR EACH ROW
  BEGIN
    UPDATE volunteer_applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Club application history trigger (auto-log status changes)
CREATE TRIGGER IF NOT EXISTS log_club_status_changes
  AFTER UPDATE OF application_status ON clubs
  FOR EACH ROW
  WHEN OLD.application_status != NEW.application_status
  BEGIN
    INSERT INTO club_application_history (
      id, club_id, admin_id, action, notes
    ) VALUES (
      lower(hex(randomblob(16))), -- Generate UUID-like ID
      NEW.id,
      NEW.reviewed_by,
      NEW.application_status,
      NEW.admin_notes
    );
  END;