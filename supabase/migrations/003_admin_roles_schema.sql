-- Admin Roles Schema
-- This migration creates tables for platform administration

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

-- Create indexes for better performance
CREATE INDEX idx_admin_roles_email ON admin_roles(email);
CREATE INDEX idx_admin_roles_is_admin ON admin_roles(is_admin);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- Row Level Security Policies

-- Enable RLS on admin tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Admin roles policies
CREATE POLICY "Admins can view admin roles" ON admin_roles
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can manage admin roles" ON admin_roles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Content reports policies
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can manage reports" ON content_reports
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Moderation actions policies
CREATE POLICY "Admins can view moderation actions" ON moderation_actions
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can create moderation actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_reports_updated_at BEFORE UPDATE ON content_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create admin functions
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(user_id UUID, suspension_reason TEXT)
RETURNS VOID AS $$
BEGIN
  -- This would typically update user metadata or call auth service
  -- For now, we'll just log the action
  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), 'account_suspension', 'user', user_id, suspension_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION moderate_content(
  content_id UUID, 
  content_type TEXT, 
  moderation_action TEXT, 
  moderation_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Log the moderation action
  INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason)
  VALUES (auth.uid(), moderation_action, 'content', content_id, moderation_reason);
  
  -- Update any related reports
  UPDATE content_reports 
  SET status = 'resolved', updated_at = NOW()
  WHERE content_id = moderate_content.content_id AND content_type = moderate_content.content_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user (replace with actual admin email)
INSERT INTO admin_roles (id, email, is_admin) 
VALUES (
  uuid_generate_v4(), 
  'admin@egsport.local', 
  true
) ON CONFLICT (email) DO NOTHING;