-- Email Notification System Migration
-- Run this migration to add email delivery tracking to your database

-- Email Delivery Logs Table
CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_delivery_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_delivery_logs(to_email);

-- Email Templates Table (for future extensibility)
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables TEXT, -- JSON array of variable names
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default templates metadata (actual templates are in code)
INSERT OR REPLACE INTO email_templates (id, name, subject, html_content, text_content, variables) VALUES
('club_approval', 'Club Application Approved', 
 '🎉 {{clubName}} - Application Approved!',
 'HTML template managed in code',
 'Text template managed in code',
 '["clubName", "contactName", "loginUrl", "supportEmail", "platformName"]'),

('club_rejection', 'Club Application Update Required',
 '{{clubName}} - Application Update Required', 
 'HTML template managed in code',
 'Text template managed in code',
 '["clubName", "contactName", "rejectionReason", "supportEmail", "platformName"]'),

('club_welcome', 'Welcome to Platform',
 '🏆 Welcome to {{platformName}} - {{clubName}}!',
 'HTML template managed in code',
 'Text template managed in code',
 '["clubName", "contactName", "loginUrl", "supportEmail", "platformName"]');