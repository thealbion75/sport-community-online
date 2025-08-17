/**
 * Cloudflare D1 Data Access Layer Index
 * Centralized exports for all D1 data access functions
 */

// Export D1 client functions
export * from './client';

// Export authentication functions
export * from './auth';

// Export admin club approval functions
export * from './admin-club-approval';

// Note: Other service modules (clubs, volunteers, opportunities, etc.) 
// will need to be migrated from Supabase to D1 as well