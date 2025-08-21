/**
 * Club Application Notification Service
 * Handles sending notifications for club approval/rejection events with security measures
 */

import { EmailService, createEmailService } from './service';
import { 
  generateApprovalTemplate, 
  generateRejectionTemplate, 
  generateWelcomeTemplate,
  ClubApplicationData 
} from './templates';
import { EmailTemplateSecurity, InputSanitizer } from '../security';

export interface Club {
  id: string;
  name: string;
  email: string;
  contact_name?: string;
  application_status: 'pending' | 'approved' | 'rejected';
}

export interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Club notification service
 */
export class ClubNotificationService {
  private emailService: EmailService;

  constructor(db?: D1Database) {
    this.emailService = createEmailService(db);
  }

  /**
   * Send approval notification to club with security validation
   */
  async sendApprovalNotification(club: Club): Promise<NotificationResult> {
    try {
      // Sanitize input data
      const sanitizedClub = {
        id: club.id,
        name: InputSanitizer.sanitizeText(club.name),
        email: InputSanitizer.sanitizeEmail(club.email),
        contact_name: club.contact_name ? InputSanitizer.sanitizeText(club.contact_name) : undefined,
        application_status: club.application_status
      };

      // Validate email format
      if (!sanitizedClub.email || sanitizedClub.email.length === 0) {
        return {
          success: false,
          emailSent: false,
          error: 'Invalid email address'
        };
      }

      const templateData: ClubApplicationData = {
        clubName: sanitizedClub.name,
        contactEmail: sanitizedClub.email,
        contactName: sanitizedClub.contact_name || 'Club Administrator',
        loginUrl: 'https://egsport.co.uk/login',
        supportEmail: 'support@egsport.co.uk',
        platformName: 'EGSport'
      };

      const template = generateApprovalTemplate(templateData);
      
      // Validate template security
      const templateValidation = EmailTemplateSecurity.validateTemplate(template.html);
      if (!templateValidation.isValid) {
        return {
          success: false,
          emailSent: false,
          error: `Template security validation failed: ${templateValidation.issues.join(', ')}`
        };
      }

      // Sanitize template with variables
      const sanitizedHtml = EmailTemplateSecurity.sanitizeTemplate(template.html, {
        clubName: sanitizedClub.name,
        contactName: sanitizedClub.contact_name || 'Club Administrator'
      });

      const secureTemplate = {
        ...template,
        html: sanitizedHtml
      };
      
      const result = await this.emailService.sendEmail({
        to: sanitizedClub.email,
        template: secureTemplate,
        maxRetries: 3
      });

      if (result.success) {
        // Send welcome email as follow-up
        await this.sendWelcomeNotification(club);
      }

      return {
        success: result.success,
        emailSent: result.success,
        error: result.error,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error sending approval notification'
      };
    }
  }

  /**
   * Send rejection notification to club with security validation
   */
  async sendRejectionNotification(club: Club, rejectionReason: string): Promise<NotificationResult> {
    try {
      // Sanitize input data
      const sanitizedClub = {
        id: club.id,
        name: InputSanitizer.sanitizeText(club.name),
        email: InputSanitizer.sanitizeEmail(club.email),
        contact_name: club.contact_name ? InputSanitizer.sanitizeText(club.contact_name) : undefined,
        application_status: club.application_status
      };

      const sanitizedReason = InputSanitizer.sanitizeText(rejectionReason);

      // Validate email format
      if (!sanitizedClub.email || sanitizedClub.email.length === 0) {
        return {
          success: false,
          emailSent: false,
          error: 'Invalid email address'
        };
      }

      // Validate rejection reason
      if (!sanitizedReason || sanitizedReason.trim().length === 0) {
        return {
          success: false,
          emailSent: false,
          error: 'Rejection reason is required'
        };
      }

      const templateData: ClubApplicationData = {
        clubName: sanitizedClub.name,
        contactEmail: sanitizedClub.email,
        contactName: sanitizedClub.contact_name || 'Club Administrator',
        rejectionReason: sanitizedReason,
        supportEmail: 'support@egsport.co.uk',
        platformName: 'EGSport'
      };

      const template = generateRejectionTemplate(templateData);
      
      // Validate template security
      const templateValidation = EmailTemplateSecurity.validateTemplate(template.html);
      if (!templateValidation.isValid) {
        return {
          success: false,
          emailSent: false,
          error: `Template security validation failed: ${templateValidation.issues.join(', ')}`
        };
      }

      // Sanitize template with variables
      const sanitizedHtml = EmailTemplateSecurity.sanitizeTemplate(template.html, {
        clubName: sanitizedClub.name,
        contactName: sanitizedClub.contact_name || 'Club Administrator',
        rejectionReason: sanitizedReason
      });

      const secureTemplate = {
        ...template,
        html: sanitizedHtml
      };
      
      const result = await this.emailService.sendEmail({
        to: sanitizedClub.email,
        template: secureTemplate,
        maxRetries: 3
      });

      return {
        success: result.success,
        emailSent: result.success,
        error: result.error,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error sending rejection notification'
      };
    }
  }

  /**
   * Send welcome notification to newly approved club with security validation
   */
  async sendWelcomeNotification(club: Club): Promise<NotificationResult> {
    try {
      // Sanitize input data
      const sanitizedClub = {
        id: club.id,
        name: InputSanitizer.sanitizeText(club.name),
        email: InputSanitizer.sanitizeEmail(club.email),
        contact_name: club.contact_name ? InputSanitizer.sanitizeText(club.contact_name) : undefined,
        application_status: club.application_status
      };

      // Validate email format
      if (!sanitizedClub.email || sanitizedClub.email.length === 0) {
        return {
          success: false,
          emailSent: false,
          error: 'Invalid email address'
        };
      }

      const templateData: ClubApplicationData = {
        clubName: sanitizedClub.name,
        contactEmail: sanitizedClub.email,
        contactName: sanitizedClub.contact_name || 'Club Administrator',
        loginUrl: 'https://egsport.co.uk/login',
        supportEmail: 'support@egsport.co.uk',
        platformName: 'EGSport'
      };

      const template = generateWelcomeTemplate(templateData);
      
      // Add a small delay before sending welcome email
      await this.delay(2000);
      
      const result = await this.emailService.sendEmail({
        to: club.email,
        template,
        maxRetries: 2 // Fewer retries for welcome email
      });

      return {
        success: result.success,
        emailSent: result.success,
        error: result.error,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error sending welcome notification'
      };
    }
  }

  /**
   * Send admin notification about email failures
   */
  async sendAdminFailureNotification(
    adminEmail: string, 
    failedEmails: Array<{ clubName: string; email: string; error: string }>
  ): Promise<NotificationResult> {
    try {
      const subject = `⚠️ Email Delivery Failures - ${failedEmails.length} notifications failed`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Delivery Failures</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .failure-item { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 6px; }
            .error-text { color: #ef4444; font-family: monospace; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Email Delivery Failures</h1>
            <p>${failedEmails.length} club notifications failed to send</p>
          </div>
          
          <div class="content">
            <p>The following club application notifications failed to send:</p>
            
            ${failedEmails.map(failure => `
              <div class="failure-item">
                <strong>Club:</strong> ${failure.clubName}<br>
                <strong>Email:</strong> ${failure.email}<br>
                <strong>Error:</strong> <span class="error-text">${failure.error}</span>
              </div>
            `).join('')}
            
            <p>Please review the email delivery logs and consider manually contacting these clubs if necessary.</p>
            
            <p>You can retry failed emails through the admin dashboard or contact the technical team for assistance.</p>
          </div>
        </body>
        </html>
      `;

      const text = `
Email Delivery Failures - ${failedEmails.length} notifications failed

The following club application notifications failed to send:

${failedEmails.map(failure => `
Club: ${failure.clubName}
Email: ${failure.email}
Error: ${failure.error}
---
`).join('')}

Please review the email delivery logs and consider manually contacting these clubs if necessary.

You can retry failed emails through the admin dashboard or contact the technical team for assistance.
      `;

      const result = await this.emailService.sendEmail({
        to: adminEmail,
        template: { subject, html, text },
        maxRetries: 2
      });

      return {
        success: result.success,
        emailSent: result.success,
        error: result.error,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error sending admin notification'
      };
    }
  }

  /**
   * Get email delivery statistics
   */
  async getEmailStats(since?: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    retrying: number;
  }> {
    try {
      const logs = await this.emailService.getEmailDeliveryLogs(1000, 0);
      
      const filteredLogs = since 
        ? logs.filter(log => log.created_at >= since)
        : logs;

      return {
        total: filteredLogs.length,
        sent: filteredLogs.filter(log => log.status === 'sent').length,
        failed: filteredLogs.filter(log => log.status === 'failed').length,
        pending: filteredLogs.filter(log => log.status === 'pending').length,
        retrying: filteredLogs.filter(log => log.status === 'retry').length
      };
    } catch (error) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        retrying: 0
      };
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<{ retried: number; errors: string[] }> {
    return this.emailService.retryFailedEmails('24 hours');
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create notification service instance
 */
export function createNotificationService(db?: D1Database): ClubNotificationService {
  return new ClubNotificationService(db);
}