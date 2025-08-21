/**
 * Email Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../service';
import type { EmailTemplate } from '../templates';

// Mock fetch globally
global.fetch = vi.fn();

// Mock D1 Database
const createMockDB = () => {
  const mockFirst = vi.fn(() => Promise.resolve({ count: 0 }));
  const mockAll = vi.fn(() => Promise.resolve({ results: [] }));
  const mockRun = vi.fn(() => Promise.resolve({ success: true }));
  
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        run: mockRun,
        first: mockFirst,
        all: mockAll
      }))
    })),
    _mockFirst: mockFirst,
    _mockAll: mockAll,
    _mockRun: mockRun
  };
};

describe('EmailService', () => {
  let emailService: EmailService;
  let mockDB: any;
  const mockTemplate: EmailTemplate = {
    subject: 'Test Subject',
    html: '<p>Test HTML</p>',
    text: 'Test Text'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDB = createMockDB();
    emailService = new EmailService({
      from: 'test@example.com',
      replyTo: 'support@example.com'
    }, mockDB);
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate
      });

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(0);
      expect(result.deliveryStatus).toBe('sent');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mailchannels.net/tx/v1/send',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should retry on failure', async () => {
      // Mock failed API response, then success
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server Error')
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('Success')
        });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate,
        maxRetries: 2
      });

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      // Mock all requests to fail
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error')
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate,
        maxRetries: 2
      });

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(2);
      expect(result.deliveryStatus).toBe('failed');
      expect(result.error).toContain('MailChannels API error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate,
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.retryCount).toBe(1);
    });

    it('should format email data correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        personalizations: [
          {
            to: [{ email: 'recipient@example.com' }]
          }
        ],
        from: {
          email: 'test@example.com',
          name: 'EGSport Platform'
        },
        reply_to: {
          email: 'support@example.com',
          name: 'EGSport Support'
        },
        subject: 'Test Subject',
        content: [
          {
            type: 'text/plain',
            value: 'Test Text'
          },
          {
            type: 'text/html',
            value: '<p>Test HTML</p>'
          }
        ]
      });
    });
  });

  describe('getFailedEmailCount', () => {
    it('should return failed email count', async () => {
      mockDB._mockFirst.mockResolvedValueOnce({ count: 5 });

      const count = await emailService.getFailedEmailCount();

      expect(count).toBe(5);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining("status = 'failed'")
      );
    });

    it('should handle database errors gracefully', async () => {
      mockDB._mockFirst.mockRejectedValueOnce(new Error('DB Error'));

      const count = await emailService.getFailedEmailCount();

      expect(count).toBe(0);
    });
  });

  describe('retryFailedEmails', () => {
    it('should retry failed emails', async () => {
      const mockFailedEmails = [
        { id: 'email1', to_email: 'test1@example.com', subject: 'Test 1', retry_count: 1 },
        { id: 'email2', to_email: 'test2@example.com', subject: 'Test 2', retry_count: 0 }
      ];

      mockDB._mockAll.mockResolvedValueOnce({ results: mockFailedEmails });

      const result = await emailService.retryFailedEmails();

      expect(result.retried).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle retry errors', async () => {
      mockDB._mockAll.mockRejectedValueOnce(new Error('DB Error'));

      const result = await emailService.retryFailedEmails();

      expect(result.retried).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to retry emails');
    });
  });

  describe('database logging', () => {
    it('should log email attempts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate
      });

      // Should call prepare for logging
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_delivery_logs')
      );
    });

    it('should handle logging errors gracefully', async () => {
      mockDB._mockRun.mockRejectedValueOnce(new Error('Log Error'));
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Success')
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        template: mockTemplate
      });

      // Should still succeed even if logging fails
      expect(result.success).toBe(true);
    });
  });
});