-- Email Delivery Logs Table
-- Tracks all email notifications sent by the system

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,
  
  -- Indexes for performance
  INDEX idx_email_logs_status ON email_delivery_logs(status),
  INDEX idx_email_logs_created_at ON email_delivery_logs(created_at),
  INDEX idx_email_logs_to_email ON email_delivery_logs(to_email)
);

-- Email Templates Table (optional - for storing dynamic templates)
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

-- Insert default templates
INSERT OR REPLACE INTO email_templates (id, name, subject, html_content, text_content, variables) VALUES
('club_approval', 'Club Application Approved', 
 '🎉 {{clubName}} - Application Approved!',
 '<!-- HTML template stored in code for better maintainability -->',
 '<!-- Text template stored in code for better maintainability -->',
 '["clubName", "contactName", "loginUrl", "supportEmail", "platformName"]'),

('club_rejection', 'Club Application Update Required',
 '{{clubName}} - Application Update Required', 
 '<!-- HTML template stored in code for better maintainability -->',
 '<!-- Text template stored in code for better maintainability -->',
 '["clubName", "contactName", "rejectionReason", "supportEmail", "platformName"]'),

('club_welcome', 'Welcome to Platform',
 '🏆 Welcome to {{platformName}} - {{clubName}}!',
 '<!-- HTML template stored in code for better maintainability -->',
 '<!-- Text template stored in code for better maintainability -->',
 '["clubName", "contactName", "loginUrl", "supportEmail", "platformName"]');