/**
 * Email Notification System - Main Export
 */

// Templates
export {
  generateApprovalTemplate,
  generateRejectionTemplate,
  generateWelcomeTemplate,
  type EmailTemplate,
  type ClubApplicationData
} from './templates';

// Service
export {
  EmailService,
  createEmailService,
  type EmailConfig,
  type EmailRequest,
  type EmailResult,
  type EmailDeliveryLog
} from './service';

// Notifications
export {
  ClubNotificationService,
  createNotificationService,
  type NotificationResult
} from './notifications';