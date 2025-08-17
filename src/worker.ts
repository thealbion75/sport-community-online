/**
 * Cloudflare Worker - API Handler
 * Handles API requests and database operations for the sports community platform
 */

import { initializeDB } from './lib/d1/client';
import { 
  getPendingClubApplications,
  getClubApplicationById,
  approveClubApplication,
  rejectClubApplication,
  getApplicationHistory,
  bulkApproveApplications,
  getClubApplicationStats
} from './lib/d1/admin-club-approval';
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser,
  cleanupExpiredSessions 
} from './lib/d1/auth';

// Cloudflare Worker Environment
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Extract auth token from request
function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Initialize database
    initializeDB(env.DB);

    // Handle CORS
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Authentication endpoints
      if (path === '/api/auth/signup' && method === 'POST') {
        const { email, password } = await request.json();
        const result = await signUp(email, password);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/auth/signin' && method === 'POST') {
        const { email, password } = await request.json();
        const result = await signIn(email, password);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/auth/signout' && method === 'POST') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'No token provided' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const result = await signOut(token);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/auth/user' && method === 'GET') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'No token provided' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const result = await getCurrentUser(token);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Admin club approval endpoints
      if (path === '/api/admin/club-applications' && method === 'GET') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Parse query parameters
        const status = url.searchParams.get('status') || undefined;
        const search = url.searchParams.get('search') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const date_from = url.searchParams.get('date_from') || undefined;
        const date_to = url.searchParams.get('date_to') || undefined;

        const filters = {
          status: status as any,
          search,
          limit,
          offset,
          date_from,
          date_to
        };

        const result = await getPendingClubApplications(filters);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path.startsWith('/api/admin/club-applications/') && method === 'GET') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const clubId = path.split('/').pop();
        if (!clubId) {
          return new Response(JSON.stringify({ success: false, error: 'Club ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await getClubApplicationById(clubId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/club-applications/approve' && method === 'POST') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get current user
        const userResult = await getCurrentUser(token);
        if (!userResult.success) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { club_id, admin_notes } = await request.json();
        const result = await approveClubApplication(club_id, userResult.data.id, admin_notes);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/club-applications/reject' && method === 'POST') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get current user
        const userResult = await getCurrentUser(token);
        if (!userResult.success) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { club_id, rejection_reason } = await request.json();
        const result = await rejectClubApplication(club_id, userResult.data.id, rejection_reason);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/club-applications/stats' && method === 'GET') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await getClubApplicationStats();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Cleanup endpoint (can be called by cron trigger)
      if (path === '/api/cleanup/sessions' && method === 'POST') {
        const result = await cleanupExpiredSessions();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unmatched routes
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};