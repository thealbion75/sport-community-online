/**
 * Security Implementation Tests
 * Tests for security measures and access control
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CSRF, 
  SessionManager, 
  RateLimiter, 
  AdminActionSecurity,
  EmailTemplateSecurity,
  ComprehensiveValidator,
  InputSanitizer
} from '../lib/security';

// Mock sessionStorage and localStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate valid CSRF tokens', () => {
    const token = CSRF.generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token).toHaveLength(64);
  });

  it('should store and retrieve CSRF tokens', () => {
    const token = 'test-token-123';
    const tokenData = JSON.stringify({ token, timestamp: Date.now() });
    
    mockSessionStorage.getItem.mockReturnValue(tokenData);
    
    CSRF.storeToken(token);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'csrf_token', 
      expect.stringContaining(token)
    );

    const retrievedToken = CSRF.getToken();
    expect(retrievedToken).toBe(token);
  });

  it('should validate CSRF tokens correctly', () => {
    const token = 'valid-token';
    const tokenData = JSON.stringify({ token, timestamp: Date.now() });
    
    mockSessionStorage.getItem.mockReturnValue(tokenData);
    
    expect(CSRF.validateToken(token)).toBe(true);
    expect(CSRF.validateToken('invalid-token')).toBe(false);
  });

  it('should reject expired CSRF tokens', () => {
    const token = 'expired-token';
    const expiredTokenData = JSON.stringify({ 
      token, 
      timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    });
    
    mockSessionStorage.getItem.mockReturnValue(expiredTokenData);
    
    const retrievedToken = CSRF.getToken();
    expect(retrievedToken).toBeNull();
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('csrf_token');
  });
});

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect expired sessions', () => {
    const expiredTime = Date.now() - (35 * 60 * 1000); // 35 minutes ago
    expect(SessionManager.isSessionExpired(expiredTime)).toBe(true);
    
    const validTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
    expect(SessionManager.isSessionExpired(validTime)).toBe(false);
  });

  it('should update activity timestamp', () => {
    SessionManager.updateActivity();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'last_activity',
      expect.any(String)
    );
  });

  it('should clear session data', () => {
    const mockKeys = ['supabase.auth.token', 'sb-test-key', 'other-key'];
    Object.defineProperty(mockLocalStorage, 'length', { value: mockKeys.length });
    
    mockKeys.forEach((key, index) => {
      mockLocalStorage.key.mockReturnValueOnce(key);
    });

    SessionManager.clearSession();
    
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('last_activity');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('csrf_token');
  });
});

describe('Rate Limiting', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it('should allow requests within rate limit', () => {
    const key = 'test-user';
    const maxRequests = 5;
    const windowMs = 60000;

    for (let i = 0; i < maxRequests; i++) {
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    }
  });

  it('should block requests exceeding rate limit', () => {
    const key = 'test-user';
    const maxRequests = 3;
    const windowMs = 60000;

    // Use up the rate limit
    for (let i = 0; i < maxRequests; i++) {
      rateLimiter.isAllowed(key, maxRequests, windowMs);
    }

    // Next request should be blocked
    expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
  });

  it('should provide rate limit information', () => {
    const key = 'test-user';
    const maxRequests = 5;
    const windowMs = 60000;

    // Make 2 requests
    rateLimiter.isAllowed(key, maxRequests, windowMs);
    rateLimiter.isAllowed(key, maxRequests, windowMs);

    const info = rateLimiter.getRateLimitInfo(key, maxRequests, windowMs);
    expect(info.remaining).toBe(3);
    expect(info.blocked).toBe(false);
  });

  it('should block IPs temporarily', () => {
    const ip = '192.168.1.1';
    
    rateLimiter.blockIp(ip, 1000); // Block for 1 second
    expect(rateLimiter.isBlocked(ip)).toBe(true);
    
    // Should unblock after timeout (we can't easily test the timeout in unit tests)
  });
});

describe('Admin Action Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate admin permissions', () => {
    const validAdminId = '123e4567-e89b-12d3-a456-426614174000';
    const invalidAdminId = 'invalid-id';

    expect(AdminActionSecurity.validateAdminPermissions(validAdminId, 'admin')).toBe(true);
    expect(AdminActionSecurity.validateAdminPermissions(invalidAdminId, 'admin')).toBe(false);
    expect(AdminActionSecurity.validateAdminPermissions('', 'admin')).toBe(false);
  });

  it('should log admin actions', () => {
    const adminId = '123e4567-e89b-12d3-a456-426614174000';
    const action = 'approve';
    const details = { clubId: 'test-club-id' };

    AdminActionSecurity.logAdminAction(adminId, action, details);

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'admin_action_logs',
      expect.stringContaining(adminId)
    );
  });

  it('should enforce rate limits for admin actions', () => {
    const adminId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Test approval rate limiting (50 per minute)
    for (let i = 0; i < 50; i++) {
      expect(AdminActionSecurity.isAdminActionAllowed(adminId, 'approve')).toBe(true);
    }
    
    // 51st request should be blocked
    expect(AdminActionSecurity.isAdminActionAllowed(adminId, 'approve')).toBe(false);
  });
});

describe('Email Template Security', () => {
  it('should validate safe email templates', () => {
    const safeTemplate = '<p>Hello {{name}}, your application has been approved.</p>';
    const validation = EmailTemplateSecurity.validateTemplate(safeTemplate);
    
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });

  it('should reject dangerous email templates', () => {
    const dangerousTemplate = '<script>alert("xss")</script><p>Hello {{name}}</p>';
    const validation = EmailTemplateSecurity.validateTemplate(dangerousTemplate);
    
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContain('Script tags are not allowed in email templates');
  });

  it('should sanitize email templates', () => {
    const template = '<p>Hello {{name}}, welcome to {{platform}}!</p>';
    const variables = {
      name: 'John <script>alert("xss")</script> Doe',
      platform: 'EGSport'
    };

    const sanitized = EmailTemplateSecurity.sanitizeTemplate(template, variables);
    
    expect(sanitized).toContain('John alert("xss") Doe'); // Script tag removed but content remains
    expect(sanitized).toContain('EGSport');
    expect(sanitized).not.toContain('<script>');
  });
});

describe('Comprehensive Validator', () => {
  it('should validate club application data', () => {
    const validData = {
      name: 'Test Club',
      contact_email: 'test@example.com',
      description: 'A test club for sports'
    };

    const validation = ComprehensiveValidator.validateClubApplication(validData);
    expect(validation.isValid).toBe(true);
    expect(Object.keys(validation.errors)).toHaveLength(0);
  });

  it('should reject invalid club application data', () => {
    const invalidData = {
      name: '', // Empty name
      contact_email: 'invalid-email', // Invalid email
      description: 'A'.repeat(2001) // Too long description
    };

    const validation = ComprehensiveValidator.validateClubApplication(invalidData);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.name).toBeDefined();
    expect(validation.errors.contact_email).toBeDefined();
    expect(validation.errors.description).toBeDefined();
  });

  it('should sanitize admin action data', () => {
    const dirtyData = {
      club_id: '123e4567-e89b-12d3-a456-426614174000',
      admin_notes: '<script>alert("xss")</script>Valid notes',
      rejection_reason: 'Reason with <b>formatting</b>'
    };

    const sanitized = ComprehensiveValidator.sanitizeAdminActionData(dirtyData);
    
    expect(sanitized.admin_notes).not.toContain('<script>');
    expect(sanitized.admin_notes).toContain('Valid notes');
    expect(sanitized.rejection_reason).not.toContain('<b>');
  });

  it('should validate UUID formats', () => {
    const validData = {
      club_id: '123e4567-e89b-12d3-a456-426614174000'
    };

    const invalidData = {
      club_id: 'invalid-uuid'
    };

    expect(() => ComprehensiveValidator.sanitizeAdminActionData(validData)).not.toThrow();
    expect(() => ComprehensiveValidator.sanitizeAdminActionData(invalidData)).toThrow('Invalid club ID format');
  });
});

describe('Input Sanitizer', () => {
  it('should sanitize HTML content', () => {
    const dirtyHtml = '<script>alert("xss")</script><p>Safe content</p>';
    const sanitized = InputSanitizer.sanitizeHtml(dirtyHtml);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe content</p>');
  });

  it('should sanitize text content', () => {
    const dirtyText = 'Hello <script>alert("xss")</script> World';
    const sanitized = InputSanitizer.sanitizeText(dirtyText);
    
    expect(sanitized).toBe('Hello alert("xss") World'); // Tags removed but content remains
  });

  it('should sanitize email addresses', () => {
    const dirtyEmail = '  TEST@EXAMPLE.COM  ';
    const sanitized = InputSanitizer.sanitizeEmail(dirtyEmail);
    
    expect(sanitized).toBe('test@example.com');
  });

  it('should reject invalid email formats', () => {
    const invalidEmail = 'not-an-email';
    const sanitized = InputSanitizer.sanitizeEmail(invalidEmail);
    
    expect(sanitized).toBe('');
  });

  it('should sanitize URLs', () => {
    const validUrl = 'https://example.com/path';
    const sanitized = InputSanitizer.sanitizeUrl(validUrl);
    
    expect(sanitized).toBe(validUrl);
  });

  it('should reject dangerous URLs', () => {
    const dangerousUrl = 'javascript:alert("xss")';
    const sanitized = InputSanitizer.sanitizeUrl(dangerousUrl);
    
    expect(sanitized).toBe('');
  });
});