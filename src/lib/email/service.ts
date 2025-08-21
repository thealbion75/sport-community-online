/**
 * Email Service for Club Application Notifications
 * Handles email sending with retry logic and error tracking
 */

import { EmailTemplate } from './templates';

export interface EmailConfig {
  from: string;
  replyTo?: string;
  apiKey?: string;
  apiUrl?: string;
}

export interface EmailRequest {
  to: string;
  template: EmailTemplate;
  retryCount?: number;
  maxRetries?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
  deliveryStatus?: 'sent' | 'failed' | 'pending';
}

export interface EmailDeliveryLog {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'retry';
  error?: string;
  retry_count: number;
  created_at: string;
  sent_at?: string;
  message_id?: string;
}

/**
 * Email service class for handling notifications
 */
export class EmailService {
  private config: EmailConfig;
  private db?: D1Database;

  constructor(config: EmailConfig, db?: D1Database) {
    this.config = config;
    this.db = db;
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    const { to, template, retryCount = 0, maxRetries = 3 } = request;
    
    try {
      // Log email attempt
      const logId = await this.logEmailAttempt(to, template.subject, 'pending', retryCount);
      
      // Send email using the configured provider
      const result = await this.sendEmailViaProvider(to, template);
      
      if (result.success) {
        // Update log with success
        await this.updateEmailLog(logId, 'sent', undefined, result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          retryCount,
          deliveryStatus: 'sent'
        };
      } else {
        // Handle failure with retry logic
        if (retryCount < maxRetries) {
          // Schedule retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
          
          await this.updateEmailLog(logId, 'retry', result.error);
          
          // In a real implementation, you'd use a queue system
          // For now, we'll attempt immediate retry with delay
          await this.delay(delay);
          
          return this.sendEmail({
            ...request,
            retryCount: retryCount + 1
          });
        } else {
          // Max retries reached, mark as failed
          await this.updateEmailLog(logId, 'failed', result.error);
          return {
            success: false,
            error: result.error,
            retryCount,
            deliveryStatus: 'failed'
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await this.delay(delay);
        
        return this.sendEmail({
          ...request,
          retryCount: retryCount + 1
        });
      }
      
      return {
        success: false,
        error: errorMessage,
        retryCount,
        deliveryStatus: 'failed'
      };
    }
  }

  /**
   * Send email via configured provider (Cloudflare Email Workers or external service)
   */
  private async sendEmailViaProvider(to: string, template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // For Cloudflare Workers, we'll use the MailChannels API
      // This is a common pattern for sending emails from Cloudflare Workers
      const emailData = {
        personalizations: [
          {
            to: [{ email: to }],
          }
        ],
        from: {
          email: this.config.from,
          name: 'EGSport Platform'
        },
        reply_to: this.config.replyTo ? {
          email: this.config.replyTo,
          name: 'EGSport Support'
        } : undefined,
        subject: template.subject,
        content: [
          {
            type: 'text/plain',
            value: template.text
          },
          {
            type: 'text/html',
            value: template.html
          }
        ]
      };

      // Use MailChannels API (free for Cloudflare Workers)
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const responseData = await response.text();
        return {
          success: true,
          messageId: `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `MailChannels API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email sending error'
      };
    }
  }

  /**
   * Log email attempt to database
   */
  private async logEmailAttempt(
    to: string, 
    subject: string, 
    status: 'pending' | 'sent' | 'failed' | 'retry',
    retryCount: number
  ): Promise<string> {
    if (!this.db) {
      return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.db.prepare(`
        INSERT INTO email_delivery_logs (
          id, to_email, subject, status, retry_count, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(id, to, subject, status, retryCount).run();
      
      return id;
    } catch (error) {
      console.error('Failed to log email attempt:', error);
      return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Update email log with result
   */
  private async updateEmailLog(
    logId: string, 
    status: 'sent' | 'failed' | 'retry',
    error?: string,
    messageId?: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.prepare(`
        UPDATE email_delivery_logs 
        SET status = ?, error_message = ?, message_id = ?, sent_at = datetime('now')
        WHERE id = ?
      `).bind(status, error || null, messageId || null, logId).run();
    } catch (error) {
      console.error('Failed to update email log:', error);
    }
  }

  /**
   * Get email delivery logs for admin monitoring
   */
  async getEmailDeliveryLogs(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<EmailDeliveryLog[]> {
    if (!this.db) return [];

    try {
      let query = `
        SELECT id, to_email as to, subject, status, error_message as error,
               retry_count, created_at, sent_at, message_id
        FROM email_delivery_logs
      `;
      
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await this.db.prepare(query).bind(...params).all();
      
      return result.results as EmailDeliveryLog[];
    } catch (error) {
      console.error('Failed to get email delivery logs:', error);
      return [];
    }
  }

  /**
   * Get failed email count for admin notifications
   */
  async getFailedEmailCount(since?: string): Promise<number> {
    if (!this.db) return 0;

    try {
      let query = `
        SELECT COUNT(*) as count
        FROM email_delivery_logs
        WHERE status = 'failed'
      `;
      
      const params: any[] = [];
      
      if (since) {
        query += ' AND created_at >= ?';
        params.push(since);
      }

      const result = await this.db.prepare(query).bind(...params).first();
      
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Failed to get failed email count:', error);
      return 0;
    }
  }

  /**
   * Retry failed emails
   */
  async retryFailedEmails(maxAge: string = '24 hours'): Promise<{ retried: number; errors: string[] }> {
    if (!this.db) return { retried: 0, errors: ['Database not available'] };

    try {
      // Get failed emails within the specified time window
      const failedEmails = await this.db.prepare(`
        SELECT id, to_email, subject, retry_count
        FROM email_delivery_logs
        WHERE status = 'failed' 
        AND retry_count < 3
        AND created_at >= datetime('now', '-' || ? || '')
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(maxAge).all();

      const errors: string[] = [];
      let retried = 0;

      for (const email of failedEmails.results as any[]) {
        try {
          // Mark as retry attempt
          await this.updateEmailLog(email.id, 'retry');
          retried++;
        } catch (error) {
          errors.push(`Failed to retry email ${email.id}: ${error}`);
        }
      }

      return { retried, errors };
    } catch (error) {
      return { 
        retried: 0, 
        errors: [`Failed to retry emails: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create email service instance
 */
export function createEmailService(db?: D1Database): EmailService {
  const config: EmailConfig = {
    from: 'noreply@egsport.co.uk',
    replyTo: 'support@egsport.co.uk'
  };

  return new EmailService(config, db);
}