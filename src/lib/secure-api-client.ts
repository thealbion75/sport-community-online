/**
 * Secure API Client
 * Provides secure HTTP client with CSRF protection, rate limiting, and input validation
 */

import { CSRF, AdminActionSecurity, ComprehensiveValidator } from './security';
import { useAuth } from '@/contexts/AuthContext';

export interface SecureApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  adminAction?: string;
  validateInput?: boolean;
  rateLimitKey?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    blocked: boolean;
  };
}

/**
 * Secure API Client Class
 */
export class SecureApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make a secure API request
   */
  async request<T = any>(
    endpoint: string, 
    options: SecureApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
      requireAdmin = false,
      adminAction,
      validateInput = true,
      rateLimitKey
    } = options;

    try {
      // Rate limiting check
      if (rateLimitKey && !AdminActionSecurity.isAdminActionAllowed('client', rateLimitKey)) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimitInfo: AdminActionSecurity.adminRateLimiter.getRateLimitInfo(
            `admin_client_${rateLimitKey}`, 50, 60000
          )
        };
      }

      // Input validation
      if (validateInput && body) {
        if (adminAction && (adminAction === 'approve' || adminAction === 'reject')) {
          const validation = ComprehensiveValidator.validateClubApplication(body);
          if (!validation.isValid) {
            return {
              success: false,
              error: `Validation failed: ${Object.values(validation.errors).flat().join(', ')}`
            };
          }
        }

        // Sanitize input data
        if (typeof body === 'object') {
          try {
            body = ComprehensiveValidator.sanitizeAdminActionData(body);
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Input validation failed'
            };
          }
        }
      }

      // Prepare headers
      const requestHeaders = {
        ...this.defaultHeaders,
        ...headers
      };

      // Add CSRF token for state-changing operations
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        CSRF.addToHeaders(requestHeaders);
      }

      // Add auth token if required
      if (requireAuth) {
        // This would typically get the token from auth context
        // For now, we'll assume it's handled by the auth system
      }

      // Prepare request body
      let requestBody: string | FormData | undefined;
      if (body) {
        if (body instanceof FormData) {
          // Add CSRF token to form data
          requestBody = CSRF.addToFormData(body);
          // Remove Content-Type header for FormData (browser will set it)
          delete requestHeaders['Content-Type'];
        } else {
          requestBody = JSON.stringify(body);
        }
      }

      // Make the request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: 'include' // Include cookies for session management
      });

      // Parse response
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle HTTP errors
      if (!response.ok) {
        return {
          success: false,
          error: responseData?.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Log admin actions
      if (adminAction && requireAdmin) {
        AdminActionSecurity.logAdminAction('client', adminAction, {
          endpoint,
          method,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<SecureApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<SecureApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<SecureApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<SecureApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Default secure API client instance
 */
export const secureApiClient = new SecureApiClient();

/**
 * Hook for secure admin API calls
 */
export function useSecureAdminApi() {
  const { user } = useAuth();

  const makeAdminRequest = async <T = any>(
    endpoint: string,
    options: SecureApiOptions & { adminAction: string }
  ): Promise<ApiResponse<T>> => {
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Check admin permissions
    if (!AdminActionSecurity.validateAdminPermissions(user.id, 'admin')) {
      return {
        success: false,
        error: 'Admin permissions required'
      };
    }

    // Check rate limiting for admin actions
    if (!AdminActionSecurity.isAdminActionAllowed(user.id, options.adminAction)) {
      return {
        success: false,
        error: 'Admin action rate limit exceeded'
      };
    }

    return secureApiClient.request<T>(endpoint, {
      ...options,
      requireAuth: true,
      requireAdmin: true,
      rateLimitKey: `admin_${user.id}_${options.adminAction}`
    });
  };

  return {
    approveClub: (clubId: string, adminNotes?: string) =>
      makeAdminRequest('/admin/club-applications/approve', {
        method: 'POST',
        body: { club_id: clubId, admin_notes: adminNotes },
        adminAction: 'approve'
      }),

    rejectClub: (clubId: string, rejectionReason: string) =>
      makeAdminRequest('/admin/club-applications/reject', {
        method: 'POST',
        body: { club_id: clubId, rejection_reason: rejectionReason },
        adminAction: 'reject'
      }),

    bulkApprove: (clubIds: string[], adminNotes?: string) =>
      makeAdminRequest('/admin/club-applications/bulk-approve', {
        method: 'POST',
        body: { clubIds, adminNotes },
        adminAction: 'bulk_approve'
      }),

    getApplications: (filters?: any) =>
      makeAdminRequest('/admin/club-applications', {
        method: 'GET',
        adminAction: 'view'
      }),

    getApplication: (clubId: string) =>
      makeAdminRequest(`/admin/club-applications/${clubId}`, {
        method: 'GET',
        adminAction: 'view'
      })
  };
}