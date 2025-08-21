/**
 * Security Utilities
 * Input sanitization, validation, and security measures
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Session Management Utilities
 */
export const SessionManager = {
  /**
   * Session timeout in milliseconds (30 minutes)
   */
  SESSION_TIMEOUT: 30 * 60 * 1000,

  /**
   * Check if session is expired
   */
  isSessionExpired(lastActivity: number): boolean {
    return Date.now() - lastActivity > this.SESSION_TIMEOUT;
  },

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('last_activity', Date.now().toString());
    }
  },

  /**
   * Get last activity timestamp
   */
  getLastActivity(): number {
    if (typeof sessionStorage !== 'undefined') {
      const lastActivity = sessionStorage.getItem('last_activity');
      return lastActivity ? parseInt(lastActivity, 10) : Date.now();
    }
    return Date.now();
  },

  /**
   * Clear session data
   */
  clearSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('last_activity');
      sessionStorage.removeItem('csrf_token');
    }
    if (typeof localStorage !== 'undefined') {
      // Clear any auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  /**
   * Initialize session monitoring
   */
  initializeSessionMonitoring(onSessionExpired: () => void): void {
    // Check session every minute
    setInterval(() => {
      const lastActivity = this.getLastActivity();
      if (this.isSessionExpired(lastActivity)) {
        this.clearSession();
        onSessionExpired();
      }
    }, 60000);

    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), { passive: true });
    });
  }
};

/**
 * Input sanitization utilities
 */
export const InputSanitizer = {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    });
  },

  /**
   * Sanitize plain text input
   */
  sanitizeText(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Sanitize email input
   */
  sanitizeEmail(email: string): string {
    const sanitized = email
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
      .trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
  },

  /**
   * Sanitize URL input
   */
  sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      
      return urlObj.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitize phone number input
   */
  sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-\s()]/g, '').trim();
  },

  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  },

  /**
   * Sanitize SQL input (basic protection)
   */
  sanitizeSql(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection chars
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // Remove SQL keywords
      .trim();
  }
};

/**
 * Content Security Policy utilities
 */
export const CSP = {
  /**
   * Generate CSP header value
   */
  generateHeader(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-* should be avoided in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];
    
    return directives.join('; ');
  },

  /**
   * Apply CSP to document
   */
  apply(): void {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.generateHeader();
      document.head.appendChild(meta);
    }
  }
};

/**
 * Rate limiting utilities (client-side)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blockedIps: Set<string> = new Set();

  /**
   * Check if request is allowed based on rate limit
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    // Check if IP is blocked
    if (this.blockedIps.has(key)) {
      return false;
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= maxRequests) {
      // Block IP if they exceed limit multiple times
      if (recentRequests.length >= maxRequests * 2) {
        this.blockIp(key, 15 * 60 * 1000); // Block for 15 minutes
      }
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  /**
   * Block an IP address temporarily
   */
  blockIp(ip: string, durationMs: number): void {
    this.blockedIps.add(ip);
    setTimeout(() => {
      this.blockedIps.delete(ip);
    }, durationMs);
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  /**
   * Get rate limit info for a key
   */
  getRateLimitInfo(key: string, maxRequests: number, windowMs: number): {
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } {
    if (this.blockedIps.has(key)) {
      return { remaining: 0, resetTime: Date.now() + windowMs, blocked: true };
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return {
      remaining: Math.max(0, maxRequests - recentRequests.length),
      resetTime: recentRequests.length > 0 ? recentRequests[0] + windowMs : now + windowMs,
      blocked: false
    };
  }

  /**
   * Clear old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < maxAge);
      
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

/**
 * CSRF protection utilities
 */
export const CSRF = {
  /**
   * Generate CSRF token
   */
  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Store CSRF token in session storage with timestamp
   */
  storeToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      const tokenData = {
        token,
        timestamp: Date.now()
      };
      sessionStorage.setItem('csrf_token', JSON.stringify(tokenData));
    }
  },

  /**
   * Get CSRF token from session storage
   */
  getToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      const tokenDataStr = sessionStorage.getItem('csrf_token');
      if (tokenDataStr) {
        try {
          const tokenData = JSON.parse(tokenDataStr);
          // Check if token is not older than 1 hour
          if (Date.now() - tokenData.timestamp < 60 * 60 * 1000) {
            return tokenData.token;
          } else {
            // Token expired, remove it
            sessionStorage.removeItem('csrf_token');
          }
        } catch {
          // Invalid token data, remove it
          sessionStorage.removeItem('csrf_token');
        }
      }
    }
    return null;
  },

  /**
   * Validate CSRF token
   */
  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  },

  /**
   * Add CSRF token to request headers
   */
  addToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  },

  /**
   * Add CSRF token to form data
   */
  addToFormData(formData: FormData): FormData {
    const token = this.getToken();
    if (token) {
      formData.append('csrf_token', token);
    }
    return formData;
  },

  /**
   * Refresh CSRF token
   */
  refreshToken(): string {
    const newToken = this.generateToken();
    this.storeToken(newToken);
    return newToken;
  }
};

/**
 * Data validation utilities
 */
export const DataValidator = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  /**
   * Check password strength
   */
  isStrongPassword(password: string): {
    isStrong: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }
    
    return {
      isStrong: issues.length === 0,
      issues
    };
  },

  /**
   * Validate file upload
   */
  isValidFile(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!allowedTypes.includes(file.type)) {
      issues.push(`File type ${file.type} is not allowed`);
    }
    
    if (file.size > maxSize) {
      issues.push(`File size exceeds maximum of ${maxSize} bytes`);
    }
    
    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      issues.push('File type is not allowed for security reasons');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

/**
 * Secure storage utilities
 */
export const SecureStorage = {
  /**
   * Encrypt data before storing (simple implementation)
   */
  encrypt(data: string, key: string): string {
    // Simple XOR encryption (not for production use)
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  },

  /**
   * Decrypt stored data
   */
  decrypt(encryptedData: string, key: string): string {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  },

  /**
   * Store sensitive data securely
   */
  setItem(key: string, value: string, encryptionKey?: string): void {
    if (typeof localStorage !== 'undefined') {
      const dataToStore = encryptionKey ? this.encrypt(value, encryptionKey) : value;
      localStorage.setItem(key, dataToStore);
    }
  },

  /**
   * Retrieve sensitive data securely
   */
  getItem(key: string, encryptionKey?: string): string | null {
    if (typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(key);
      if (storedData && encryptionKey) {
        return this.decrypt(storedData, encryptionKey);
      }
      return storedData;
    }
    return null;
  }
};

/**
 * Email Template Security
 */
export const EmailTemplateSecurity = {
  /**
   * Sanitize email template content to prevent injection
   */
  sanitizeTemplate(template: string, variables: Record<string, string>): string {
    // First sanitize the template itself
    let sanitizedTemplate = DOMPurify.sanitize(template, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href'],
      ALLOWED_URI_REGEXP: /^https?:\/\//
    });

    // Sanitize all variables before substitution
    const sanitizedVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      sanitizedVariables[key] = InputSanitizer.sanitizeText(value);
    }

    // Replace variables in template
    for (const [key, value] of Object.entries(sanitizedVariables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      sanitizedTemplate = sanitizedTemplate.replace(placeholder, value);
    }

    return sanitizedTemplate;
  },

  /**
   * Validate email template for security issues
   */
  validateTemplate(template: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for script tags
    if (/<script/i.test(template)) {
      issues.push('Script tags are not allowed in email templates');
    }

    // Check for javascript: URLs
    if (/javascript:/i.test(template)) {
      issues.push('JavaScript URLs are not allowed in email templates');
    }

    // Check for data: URLs
    if (/data:/i.test(template)) {
      issues.push('Data URLs are not allowed in email templates');
    }

    // Check for form elements
    if (/<form|<input|<textarea|<select/i.test(template)) {
      issues.push('Form elements are not allowed in email templates');
    }

    // Check for external resource loading
    if (/<link|<style|@import/i.test(template)) {
      issues.push('External stylesheets are not allowed in email templates');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

/**
 * Admin Action Security
 */
export const AdminActionSecurity = {
  /**
   * Rate limiter for admin actions
   */
  adminRateLimiter: new RateLimiter(),

  /**
   * Check if admin action is allowed
   */
  isAdminActionAllowed(adminId: string, action: string): boolean {
    const key = `admin_${adminId}_${action}`;
    
    // Different limits for different actions
    const limits = {
      approve: { max: 50, window: 60 * 1000 }, // 50 approvals per minute
      reject: { max: 30, window: 60 * 1000 },  // 30 rejections per minute
      bulk_approve: { max: 5, window: 60 * 1000 }, // 5 bulk operations per minute
      view: { max: 200, window: 60 * 1000 } // 200 views per minute
    };

    const limit = limits[action as keyof typeof limits] || limits.view;
    return this.adminRateLimiter.isAllowed(key, limit.max, limit.window);
  },

  /**
   * Log admin action for audit trail
   */
  logAdminAction(adminId: string, action: string, details: Record<string, any>): void {
    const logEntry = {
      adminId,
      action,
      details: InputSanitizer.sanitizeText(JSON.stringify(details)),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      ip: 'client-side' // This would be filled server-side
    };

    // Store in session storage for now (in production, send to server)
    if (typeof sessionStorage !== 'undefined') {
      const existingLogs = sessionStorage.getItem('admin_action_logs');
      let logs: any[] = [];
      
      try {
        logs = existingLogs ? JSON.parse(existingLogs) : [];
        // Ensure logs is an array
        if (!Array.isArray(logs)) {
          logs = [];
        }
      } catch {
        logs = [];
      }
      
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      sessionStorage.setItem('admin_action_logs', JSON.stringify(logs));
    }
  },

  /**
   * Validate admin permissions before action
   */
  validateAdminPermissions(adminId: string, requiredRole: string): boolean {
    // This would typically check against a server-side permission system
    // For now, we'll do basic validation
    if (!adminId || adminId.trim().length === 0) {
      return false;
    }

    // Check if admin ID format is valid (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(adminId);
  }
};

/**
 * Comprehensive Input Validation
 */
export const ComprehensiveValidator = {
  /**
   * Validate club application data
   */
  validateClubApplication(data: any): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    // Validate club name
    if (!data.name || typeof data.name !== 'string') {
      errors.name = ['Club name is required'];
    } else {
      const sanitizedName = InputSanitizer.sanitizeText(data.name);
      if (sanitizedName.length < 2) {
        errors.name = ['Club name must be at least 2 characters long'];
      } else if (sanitizedName.length > 100) {
        errors.name = ['Club name must be less than 100 characters'];
      }
    }

    // Validate email
    if (!data.contact_email || typeof data.contact_email !== 'string') {
      errors.contact_email = ['Contact email is required'];
    } else if (!DataValidator.isValidEmail(data.contact_email)) {
      errors.contact_email = ['Invalid email format'];
    }

    // Validate description
    if (data.description && typeof data.description === 'string') {
      const sanitizedDescription = InputSanitizer.sanitizeText(data.description);
      if (sanitizedDescription.length > 2000) {
        errors.description = ['Description must be less than 2000 characters'];
      }
    }

    // Validate admin notes (if present)
    if (data.admin_notes && typeof data.admin_notes === 'string') {
      const sanitizedNotes = InputSanitizer.sanitizeText(data.admin_notes);
      if (sanitizedNotes.length > 1000) {
        errors.admin_notes = ['Admin notes must be less than 1000 characters'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Sanitize and validate admin action data
   */
  sanitizeAdminActionData(data: any): any {
    const sanitized = { ...data };

    // Sanitize string fields
    if (sanitized.admin_notes) {
      sanitized.admin_notes = InputSanitizer.sanitizeText(sanitized.admin_notes);
    }

    if (sanitized.rejection_reason) {
      sanitized.rejection_reason = InputSanitizer.sanitizeText(sanitized.rejection_reason);
    }

    // Validate and sanitize club IDs
    if (sanitized.club_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitized.club_id)) {
        throw new Error('Invalid club ID format');
      }
    }

    if (sanitized.clubIds && Array.isArray(sanitized.clubIds)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      sanitized.clubIds = sanitized.clubIds.filter((id: string) => 
        typeof id === 'string' && uuidRegex.test(id)
      );
    }

    return sanitized;
  }
};

/**
 * Initialize security measures
 */
export function initializeSecurity(onSessionExpired?: () => void): void {
  // Apply CSP
  CSP.apply();
  
  // Set up rate limiter cleanup
  const rateLimiter = new RateLimiter();
  setInterval(() => rateLimiter.cleanup(), 60000); // Cleanup every minute
  
  // Generate and store CSRF token
  const csrfToken = CSRF.generateToken();
  CSRF.storeToken(csrfToken);

  // Initialize session monitoring if callback provided
  if (onSessionExpired) {
    SessionManager.initializeSessionMonitoring(onSessionExpired);
  }

  // Set up periodic CSRF token refresh
  setInterval(() => {
    CSRF.refreshToken();
  }, 30 * 60 * 1000); // Refresh every 30 minutes
}