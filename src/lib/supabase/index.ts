/**
 * Supabase Data Access Layer Index
 * Centralized exports for all data access functions
 */

// Export all club functions
export * from './clubs';

// Export all volunteer functions
export * from './volunteers';

// Export all opportunity functions
export * from './opportunities';

// Export all application functions
export * from './applications';

// Export all message functions
export * from './messages';

// Export all auth functions
export * from './auth';

// Export all admin club approval functions
export * from './admin-club-approval';

// Re-export the supabase client
export { supabase } from '@/integrations/supabase/client';