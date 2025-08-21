/**
 * Club Notification Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClubNotificationService } from '../notifications';
import type { Club } from '../notifications';

// Mock the email service
const mockEmailService = {
  sendEmail: vi.fn(),
  getEmailDeliveryLogs: vi.fn(),
  getFailedEmailCount: vi.fn(),
  retryFailedEmails: vi.fn()
};

vi.mock('../service', () => ({
  createEmailService: vi.fn(() => mockEmailService)
}));

describe('ClubNotificationService', () => {
  let notificationService: ClubNotificationService;

  const mockClub: Club = {
    id: 'club-123',
    name: 'Test Football Club',
    email: 'test@example.com',
    contact_name: 'John Doe',
    application_status: 'approved'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new ClubNotificationService();
  });

  describe('sendApprovalNotification', () => {
    it('should send approval notification successfully', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });

      const result = await notificationService.sendApprovalNotification(mockClub);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        template: expect.objectContaining({
          subject: expect.stringContaining('Test Football Club'),
          html: expect.stringContaining('Test Football Club'),
          text: expect.stringContaining('Test Football Club')
        }),
        maxRetries: 3
      });
    });

    it('should handle email sending failure', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'SMTP Error'
      });

      const result = await notificationService.sendApprovalNotification(mockClub);

      expect(result.success).toBe(false);
      expect(result.emailSent).toBe(false);
      expect(result.error).toBe('SMTP Error');
    });

    it('should send welcome email after approval', async () => {
      mockEmailService.sendEmail
        .mockResolvedValueOnce({ success: true, messageId: 'approval-123' })
        .mockResolvedValueOnce({ success: true, messageId: 'welcome-123' });

      const result = await notificationService.sendApprovalNotification(mockClub);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2);
      
      // Check that welcome email is sent after approval
      const welcomeCall = mockEmailService.sendEmail.mock.calls[1];
      expect(welcomeCall[0].template.subject).toContain('Welcome');
    });

    it('should use default contact name when not provided', async () => {
      const clubWithoutContactName = { ...mockClub, contact_name: undefined };
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123'
      });

      await notificationService.sendApprovalNotification(clubWithoutContactName);

      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      expect(emailCall[0].template.html).toContain('Club Administrator');
    });
  });

  describe('sendRejectionNotification', () => {
    it('should send rejection notification with reason', async () => {
      const rejectionReason = 'Missing required documentation';
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'rejection-123'
      });

      const result = await notificationService.sendRejectionNotification(
        mockClub, 
        rejectionReason
      );

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        template: expect.objectContaining({
          subject: expect.stringContaining('Application Update Required'),
          html: expect.stringContaining(rejectionReason),
          text: expect.stringContaining(rejectionReason)
        }),
        maxRetries: 3
      });
    });

    it('should handle rejection email failure', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Email service unavailable'
      });

      const result = await notificationService.sendRejectionNotification(
        mockClub, 
        'Test reason'
      );

      expect(result.success).toBe(false);
      expect(result.emailSent).toBe(false);
      expect(result.error).toBe('Email service unavailable');
    });
  });

  describe('sendWelcomeNotification', () => {
    it('should send welcome notification with delay', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'welcome-123'
      });

      const startTime = Date.now();
      const result = await notificationService.sendWelcomeNotification(mockClub);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000); // 2 second delay
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        template: expect.objectContaining({
          subject: expect.stringContaining('Welcome'),
          html: expect.stringContaining('Welcome'),
          text: expect.stringContaining('Welcome')
        }),
        maxRetries: 2 // Fewer retries for welcome email
      });
    });
  });

  describe('sendAdminFailureNotification', () => {
    it('should send admin notification about failed emails', async () => {
      const failedEmails = [
        { clubName: 'Club A', email: 'a@example.com', error: 'SMTP Error' },
        { clubName: 'Club B', email: 'b@example.com', error: 'Invalid email' }
      ];

      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'admin-123'
      });

      const result = await notificationService.sendAdminFailureNotification(
        'admin@example.com',
        failedEmails
      );

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'admin@example.com',
        template: expect.objectContaining({
          subject: expect.stringContaining('2 notifications failed'),
          html: expect.stringContaining('Club A'),
          html: expect.stringContaining('Club B'),
          text: expect.stringContaining('SMTP Error')
        }),
        maxRetries: 2
      });
    });
  });

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const mockLogs = [
        { status: 'sent', created_at: '2024-01-01' },
        { status: 'sent', created_at: '2024-01-01' },
        { status: 'failed', created_at: '2024-01-01' },
        { status: 'pending', created_at: '2024-01-01' },
        { status: 'retry', created_at: '2024-01-01' }
      ];

      mockEmailService.getEmailDeliveryLogs.mockResolvedValueOnce(mockLogs);

      const stats = await notificationService.getEmailStats();

      expect(stats).toEqual({
        total: 5,
        sent: 2,
        failed: 1,
        pending: 1,
        retrying: 1
      });
    });

    it('should filter stats by date when provided', async () => {
      const mockLogs = [
        { status: 'sent', created_at: '2024-01-02' },
        { status: 'failed', created_at: '2024-01-01' } // Should be filtered out
      ];

      mockEmailService.getEmailDeliveryLogs.mockResolvedValueOnce(mockLogs);

      const stats = await notificationService.getEmailStats('2024-01-02');

      expect(stats.total).toBe(1);
      expect(stats.sent).toBe(1);
      expect(stats.failed).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockEmailService.getEmailDeliveryLogs.mockRejectedValueOnce(new Error('DB Error'));

      const stats = await notificationService.getEmailStats();

      expect(stats).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        retrying: 0
      });
    });
  });

  describe('retryFailedNotifications', () => {
    it('should delegate to email service retry method', async () => {
      const mockRetryResult = { retried: 3, errors: [] };
      mockEmailService.retryFailedEmails.mockResolvedValueOnce(mockRetryResult);

      const result = await notificationService.retryFailedNotifications();

      expect(result).toEqual(mockRetryResult);
      expect(mockEmailService.retryFailedEmails).toHaveBeenCalledWith('24 hours');
    });
  });

  describe('error handling', () => {
    it('should handle service initialization errors', () => {
      expect(() => new ClubNotificationService()).not.toThrow();
    });

    it('should handle unexpected errors in notification methods', async () => {
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await notificationService.sendApprovalNotification(mockClub);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error sending approval notification');
    });
  });
});