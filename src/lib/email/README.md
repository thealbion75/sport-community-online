# Email Notification System

This module provides a comprehensive email notification system for club application status updates in the EGSport platform.

## Features

- **Email Templates**: Pre-built HTML and text templates for approval, rejection, and welcome notifications
- **Retry Logic**: Automatic retry with exponential backoff for failed email deliveries
- **Delivery Tracking**: Complete audit trail of all email notifications
- **Error Handling**: Graceful error handling with admin notifications for failures
- **Mobile-Friendly**: Responsive email templates that work on all devices

## Components

### Templates (`templates.ts`)
- `generateApprovalTemplate()` - Creates approval notification emails
- `generateRejectionTemplate()` - Creates rejection notification emails with feedback
- `generateWelcomeTemplate()` - Creates welcome emails for newly approved clubs

### Email Service (`service.ts`)
- `EmailService` - Core email sending service with retry logic
- Integrates with MailChannels API for Cloudflare Workers
- Provides delivery tracking and failure monitoring

### Notification Service (`notifications.ts`)
- `ClubNotificationService` - High-level service for club-specific notifications
- Handles the complete notification workflow
- Provides statistics and retry functionality

## Usage

### Basic Usage

```typescript
import { createNotificationService } from '@/lib/email/notifications';

const notificationService = createNotificationService(db);

// Send approval notification
await notificationService.sendApprovalNotification({
  id: 'club-123',
  name: 'Football Club',
  email: 'contact@club.com',
  application_status: 'approved'
});

// Send rejection notification
await notificationService.sendRejectionNotification(club, 'Missing documentation');
```

### Integration with Admin Functions

The notification system is automatically integrated with the admin club approval functions:

```typescript
// Approval automatically sends notification
const result = await approveClubApplication(clubId, adminId, notes, db);

// Rejection automatically sends notification
const result = await rejectClubApplication(clubId, adminId, reason, db);
```

### Monitoring Email Delivery

```typescript
// Get email statistics
const stats = await notificationService.getEmailStats();
console.log(`Sent: ${stats.sent}, Failed: ${stats.failed}`);

// Retry failed emails
const retryResult = await notificationService.retryFailedNotifications();
console.log(`Retried: ${retryResult.retried} emails`);
```

## Database Schema

The system requires the following database tables:

```sql
-- Email delivery logs
CREATE TABLE email_delivery_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  message_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);
```

Run the migration file `migration.sql` to set up the required tables.

## Configuration

### Environment Variables

The system uses the following configuration:

- **From Email**: `noreply@egsport.co.uk`
- **Reply-To**: `support@egsport.co.uk`
- **Email Provider**: MailChannels (free for Cloudflare Workers)

### Cloudflare Workers Setup

The system is designed to work with Cloudflare Workers and uses MailChannels for email delivery. No additional API keys are required for basic functionality.

## Error Handling

- **Email Failures**: Automatically retried up to 3 times with exponential backoff
- **Database Errors**: Gracefully handled without breaking the approval process
- **Network Issues**: Retry logic handles temporary connectivity problems
- **Admin Notifications**: Failed emails trigger admin notifications

## Testing

Run the test suite:

```bash
npm test src/lib/email/__tests__
```

The test suite includes:
- Template generation tests
- Email service functionality tests
- Notification service integration tests
- Error handling and retry logic tests

## API Endpoints

The system exposes the following admin endpoints:

- `GET /api/admin/email/stats` - Get email delivery statistics
- `POST /api/admin/email/retry-failed` - Retry failed email notifications

## React Components

- `EmailNotificationStatus` - Admin dashboard component for monitoring email delivery
- `useEmailStats` - React hook for email statistics
- `useRetryFailedEmails` - React hook for retrying failed emails

## Security Considerations

- All email content is sanitized to prevent injection attacks
- Admin authentication required for all email management endpoints
- Rate limiting should be implemented for email sending endpoints
- Email templates are stored in code to prevent template injection

## Performance

- Email sending is non-blocking and doesn't affect approval process performance
- Database logging is optimized with proper indexes
- Retry logic uses exponential backoff to avoid overwhelming email services
- Statistics queries are optimized for dashboard performance