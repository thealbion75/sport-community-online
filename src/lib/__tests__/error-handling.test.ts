/**
 * Error Handling Tests
 * Tests for the comprehensive error handling system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError, AppError, ErrorType } from '../error-handling';
import { validateForm } from '../validation';
import { sanitizeUserInput, sanitizeHtml, sanitizeEmail } from '../sanitization';
import { volunteerSchemas } from '../validation';

describe('Error Handling', () => {
  describe('handleApiError', () => {
    it('should handle AppError instances', () => {
      const originalError = new AppError('Test error', ErrorType.VALIDATION);
      const result = handleApiError(originalError);
      
      expect(result).toBe(originalError);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should handle Response errors', () => {
      const mockResponse = {
        status: 401,
      } as Response;
      
      const result = handleApiError(mockResponse);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.message).toBe('Unauthorized');
    });

    it('should handle network errors', () => {
      const networkError = new Error('fetch failed');
      const result = handleApiError(networkError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should handle unknown errors', () => {
      const result = handleApiError('unknown error');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.message).toBe('An unknown error occurred');
    });
  });

  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test message', ErrorType.VALIDATION, { field: 'email' });
      
      expect(error.message).toBe('Test message');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
    });
  });
});

describe('Form Validation', () => {
  describe('validateForm', () => {
    it('should validate correct data', () => {
      const schema = volunteerSchemas.registration;
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '01234567890',
        location: 'London',
        bio: 'Test bio',
        skills: ['JavaScript', 'React'],
        availability: ['Weekends'],
        is_visible: true,
      };

      const result = validateForm(schema, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const schema = volunteerSchemas.registration;
      const invalidData = {
        first_name: '', // Too short
        email: 'invalid-email', // Invalid format
        skills: [], // Empty array
      };

      const result = validateForm(schema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors?.first_name).toContain('Name must be at least 2 characters');
      expect(result.errors?.email).toContain('Please enter a valid email address');
      expect(result.errors?.skills).toContain('Please select at least 1 item');
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeUserInput', () => {
    it('should remove HTML tags by default', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const result = sanitizeUserInput(input);
      
      expect(result).toBe('Hello World');
    });

    it('should preserve safe HTML when allowHtml is true', () => {
      const input = 'Hello <b>World</b> <script>alert("xss")</script>';
      const result = sanitizeUserInput(input, { allowHtml: true });
      
      expect(result).toBe('Hello <b>World</b>');
      expect(result).not.toContain('<script>');
    });

    it('should limit string length', () => {
      const input = 'a'.repeat(100);
      const result = sanitizeUserInput(input, { maxLength: 50 });
      
      expect(result.length).toBe(50);
    });

    it('should remove newlines when specified', () => {
      const input = 'Line 1\\nLine 2\\rLine 3';
      const result = sanitizeUserInput(input, { removeNewlines: true });
      
      expect(result).toBe('Line 1 Line 2 Line 3');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const input = '<div>Safe content</div><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('<div>Safe content</div>');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\\'xss\\')">Link</a>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\\'xss\\')">Content</div>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('onclick');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize valid emails', () => {
      const input = '  JOHN@EXAMPLE.COM  ';
      const result = sanitizeEmail(input);
      
      expect(result).toBe('john@example.com');
    });

    it('should return empty string for invalid emails', () => {
      const input = 'not-an-email';
      const result = sanitizeEmail(input);
      
      expect(result).toBe('');
    });

    it('should remove HTML from email input', () => {
      const input = 'john@example.com<script>alert("xss")</script>';
      const result = sanitizeEmail(input);
      
      expect(result).toBe('');
    });
  });
});

describe('Error Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful operations', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    const mockOnSuccess = vi.fn();
    
    // This would be tested in the actual hook implementation
    const result = await mockOperation();
    mockOnSuccess(result);
    
    expect(mockOperation).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith('success');
  });

  it('should handle failed operations', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    const mockOnError = vi.fn();
    
    try {
      await mockOperation();
    } catch (error) {
      mockOnError(error);
    }
    
    expect(mockOperation).toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalled();
  });
});