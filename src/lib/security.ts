/**
 * Security Utilities
 * Input sanitization, validation, and security measures
 */

import DOMPurify from 'isomorphic-dompurify';

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
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Sanitize email input
   */
  sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
      .trim();
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

  /**
   * Check if request is allowed based on rate limit
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
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
   * Store CSRF token in session storage
   */
  storeToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('csrf_token', token);
    }
  },

  /**
   * Get CSRF token from session storage
   */
  getToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('csrf_token');
    }
    return null;
  },

  /**
   * Validate CSRF token
   */
  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
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
 * Initialize security measures
 */
export function initializeSecurity(): void {
  // Apply CSP
  CSP.apply();
  
  // Set up rate limiter cleanup
  const rateLimiter = new RateLimiter();
  setInterval(() => rateLimiter.cleanup(), 60000); // Cleanup every minute
  
  // Generate and store CSRF token
  const csrfToken = CSRF.generateToken();
  CSRF.storeToken(csrfToken);
}