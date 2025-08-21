-- Bulk Operations Support for Club Approval Workflow
-- This migration extends the club approval system to support bulk operations and audit logging

-- Extend the action enum to support bulk operations
ALTER TABLE club_application_history 
DROP CONSTRAINT IF EXISTS club_application_history_action_check;

ALTER TABLE club_application_history 
ADD CONSTRAINT club_application_history_action_check 
CHECK (action IN ('approved', 'rejected', 'pending', 'bulk_approve_start', 'bulk_approve_complete', 'bulk_approve_error'));

-- Allow club_id to be nullable for bulk operations that don't relate to a specific club
ALTER TABLE club_application_history 
ALTER COLUMN club_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
ALTER TABLE club_application_history 
DROP CONSTRAINT IF EXISTS club_application_history_club_id_fkey;

ALTER TABLE club_application_history 
ADD CONSTRAINT club_application_history_club_id_fkey 
FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;

-- Add index for bulk operation queries
CREATE INDEX IF NOT EXISTS idx_club_application_history_bulk_operations 
ON club_application_history(admin_id, action, created_at) 
WHERE club_id IS NULL;

-- Function to log bulk operations
CREATE OR REPLACE FUNCTION log_bulk_operation(
  admin_id_param UUID,
  action_param TEXT,
  details_param JSONB
)
RETURNS VOID AS $
BEGIN
  -- Verify the user is an admin
  IF NOT is_platform_admin(admin_id_param) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Insert bulk operation log
  INSERT INTO club_application_history (club_id, admin_id, action, notes, created_at)
  VALUES (NULL, admin_id_param, action_param, details_param::TEXT, NOW());
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get bulk operation history for audit purposes
CREATE OR REPLACE FUNCTION get_bulk_operation_history(
  admin_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  -- Verify the user is an admin
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    h.id,
    h.admin_id,
    ar.email as admin_email,
    h.action,
    h.notes::JSONB as details,
    h.created_at
  FROM club_application_history h
  LEFT JOIN admin_roles ar ON h.admin_id = ar.id
  WHERE h.club_id IS NULL
    AND (admin_id_param IS NULL OR h.admin_id = admin_id_param)
    AND h.action LIKE 'bulk_%'
  ORDER BY h.created_at DESC
  LIMIT limit_param;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle bulk operation logs
CREATE POLICY "Admins can view bulk operation history" ON club_application_history
  FOR SELECT USING (
    club_id IS NULL 
    AND auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can create bulk operation logs" ON club_application_history
  FOR INSERT WITH CHECK (
    club_id IS NULL 
    AND auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN club_application_history.club_id IS 'Club ID for individual operations, NULL for bulk operations';
COMMENT ON COLUMN club_application_history.action IS 'Action type: approved, rejected, pending for individual operations; bulk_* for bulk operations';
COMMENT ON COLUMN club_application_history.notes IS 'Admin notes for individual operations, JSON details for bulk operations';

-- Create a view for easier bulk operation reporting
CREATE OR REPLACE VIEW bulk_operation_summary AS
SELECT 
  h.id,
  h.admin_id,
  ar.email as admin_email,
  h.action,
  h.notes::JSONB as details,
  h.created_at,
  CASE 
    WHEN h.action = 'bulk_approve_start' THEN (h.notes::JSONB ->> 'total_count')::INTEGER
    WHEN h.action = 'bulk_approve_complete' THEN (h.notes::JSONB ->> 'successful_count')::INTEGER
    ELSE NULL
  END as operation_count,
  CASE 
    WHEN h.action = 'bulk_approve_complete' THEN (h.notes::JSONB ->> 'failed_count')::INTEGER
    ELSE NULL
  END as failed_count
FROM club_application_history h
LEFT JOIN admin_roles ar ON h.admin_id = ar.id
WHERE h.club_id IS NULL AND h.action LIKE 'bulk_%'
ORDER BY h.created_at DESC;

-- Grant appropriate permissions on the view
GRANT SELECT ON bulk_operation_summary TO authenticated;

-- Add RLS to the view
ALTER VIEW bulk_operation_summary SET (security_barrier = true);
CREATE POLICY "Admins can view bulk operation summary" ON bulk_operation_summary
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_roles WHERE is_admin = true
    )
  );