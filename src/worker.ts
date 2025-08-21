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
import { createNotificationService } from './lib/email/notifications';

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

// Rate limiter for API endpoints
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

// Extract auth token from request
function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Validate CSRF token for state-changing operations
function validateCSRFToken(request: Request): boolean {
  const csrfToken = request.headers.get('X-CSRF-Token');
  if (!csrfToken) {
    return false;
  }
  
  // In a real implementation, this would validate against a server-side store
  // For now, we'll do basic format validation
  return /^[a-f0-9]{64}$/.test(csrfToken);
}

// Rate limiting check
function checkRateLimit(clientId: string, endpoint: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
  const key = `${clientId}_${endpoint}`;
  const now = Date.now();
  
  const current = rateLimiter.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Get client identifier for rate limiting
function getClientId(request: Request): string {
  // Use IP address or user ID for rate limiting
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const forwarded = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  return `${forwarded}_${userAgent.substring(0, 50)}`;
}

// Sanitize input data
function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000); // Limit length
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
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
        const location = url.searchParams.get('location') || undefined;
        const search_fields_param = url.searchParams.get('search_fields');
        const search_fields = search_fields_param ? 
          search_fields_param.split(',').filter(field => 
            ['name', 'email', 'description'].includes(field)
          ) as ('name' | 'email' | 'description')[] : 
          undefined;
        const sort_by = url.searchParams.get('sort_by') || undefined;
        const sort_order = url.searchParams.get('sort_order') || undefined;

        const filters = {
          status: status as any,
          search,
          search_fields,
          location,
          limit,
          offset,
          date_from,
          date_to,
          sort_by: sort_by as any,
          sort_order: sort_order as any
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
        const clientId = getClientId(request);
        
        // Rate limiting check
        if (!checkRateLimit(clientId, 'approve', 30, 60000)) { // 30 approvals per minute
          return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // CSRF token validation
        if (!validateCSRFToken(request)) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

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

        const rawData = await request.json();
        const sanitizedData = sanitizeInput(rawData);
        const { club_id, admin_notes } = sanitizedData;
        
        // Additional validation
        if (!club_id || typeof club_id !== 'string') {
          return new Response(JSON.stringify({ success: false, error: 'Invalid club ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await approveClubApplication(club_id, userResult.data.id, admin_notes, env.DB);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/club-applications/reject' && method === 'POST') {
        const clientId = getClientId(request);
        
        // Rate limiting check
        if (!checkRateLimit(clientId, 'reject', 20, 60000)) { // 20 rejections per minute
          return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // CSRF token validation
        if (!validateCSRFToken(request)) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

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

        const rawData = await request.json();
        const sanitizedData = sanitizeInput(rawData);
        const { club_id, rejection_reason } = sanitizedData;
        
        // Additional validation
        if (!club_id || typeof club_id !== 'string') {
          return new Response(JSON.stringify({ success: false, error: 'Invalid club ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'Rejection reason is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await rejectClubApplication(club_id, userResult.data.id, rejection_reason.trim(), env.DB);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/club-applications/bulk-approve' && method === 'POST') {
        const clientId = getClientId(request);
        
        // Rate limiting check (stricter for bulk operations)
        if (!checkRateLimit(clientId, 'bulk_approve', 5, 60000)) { // 5 bulk operations per minute
          return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // CSRF token validation
        if (!validateCSRFToken(request)) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

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

        const rawData = await request.json();
        const sanitizedData = sanitizeInput(rawData);
        const { clubIds, adminNotes } = sanitizedData;
        
        // Additional validation
        if (!Array.isArray(clubIds) || clubIds.length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid club IDs array' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (clubIds.length > 50) {
          return new Response(JSON.stringify({ success: false, error: 'Cannot approve more than 50 applications at once' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate each club ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const validClubIds = clubIds.filter((id: string) => typeof id === 'string' && uuidRegex.test(id));
        
        if (validClubIds.length !== clubIds.length) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid club ID format detected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await bulkApproveApplications(validClubIds, userResult.data.id, adminNotes, env.DB);
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

      // Email management endpoints
      if (path === '/api/admin/email/stats' && method === 'GET') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const notificationService = createNotificationService(env.DB);
        const since = url.searchParams.get('since') || undefined;
        const stats = await notificationService.getEmailStats(since);
        
        return new Response(JSON.stringify({ success: true, data: stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/email/retry-failed' && method === 'POST') {
        const token = getAuthToken(request);
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const notificationService = createNotificationService(env.DB);
        const result = await notificationService.retryFailedNotifications();
        
        return new Response(JSON.stringify({ success: true, data: result }), {
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