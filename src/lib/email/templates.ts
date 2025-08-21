/**
 * Email Templates for Club Application Notifications
 * Provides HTML and text templates for different notification types
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ClubApplicationData {
  clubName: string;
  contactEmail: string;
  contactName?: string;
  rejectionReason?: string;
  loginUrl?: string;
  supportEmail?: string;
  platformName?: string;
}

/**
 * Generate approval notification email template
 */
export function generateApprovalTemplate(data: ClubApplicationData): EmailTemplate {
  const {
    clubName,
    contactName = 'Club Administrator',
    loginUrl = 'https://egsport.co.uk/login',
    supportEmail = 'support@egsport.co.uk',
    platformName = 'EGSport'
  } = data;

  const subject = `🎉 ${clubName} - Application Approved!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="success-icon">🎉</div>
        <h1>Congratulations!</h1>
        <p>Your club application has been approved</p>
      </div>
      
      <div class="content">
        <h2>Welcome to ${platformName}, ${contactName}!</h2>
        
        <p>We're excited to inform you that <strong>${clubName}</strong> has been approved to join our sports community platform.</p>
        
        <h3>What's Next?</h3>
        <ul>
          <li><strong>Access Your Dashboard:</strong> You can now log in to manage your club profile, events, and members</li>
          <li><strong>Complete Your Profile:</strong> Add more details about your club, upload photos, and set your preferences</li>
          <li><strong>Start Connecting:</strong> Browse other clubs, join events, and build your community network</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" class="button">Access Your Club Dashboard</a>
        </div>
        
        <h3>Getting Started Tips:</h3>
        <ul>
          <li>Update your club description and contact information</li>
          <li>Add your club's logo and photos</li>
          <li>Create your first event or activity</li>
          <li>Invite your members to join the platform</li>
        </ul>
        
        <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>
      </div>
      
      <div class="footer">
        <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        <p>This email was sent regarding your club application for ${clubName}.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 Congratulations! Your club application has been approved

Dear ${contactName},

We're excited to inform you that ${clubName} has been approved to join our ${platformName} sports community platform.

What's Next?
- Access Your Dashboard: You can now log in to manage your club profile, events, and members
- Complete Your Profile: Add more details about your club, upload photos, and set your preferences  
- Start Connecting: Browse other clubs, join events, and build your community network

Access your club dashboard: ${loginUrl}

Getting Started Tips:
- Update your club description and contact information
- Add your club's logo and photos
- Create your first event or activity
- Invite your members to join the platform

If you have any questions or need assistance getting started, please contact us at ${supportEmail}.

Best regards,
The ${platformName} Team
  `;

  return { subject, html, text };
}

/**
 * Generate rejection notification email template
 */
export function generateRejectionTemplate(data: ClubApplicationData): EmailTemplate {
  const {
    clubName,
    contactName = 'Club Administrator',
    rejectionReason = 'Your application did not meet our current requirements.',
    supportEmail = 'support@egsport.co.uk',
    platformName = 'EGSport'
  } = data;

  const subject = `${clubName} - Application Update Required`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Update Required</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .feedback-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .info-icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="info-icon">📋</div>
        <h1>Application Update Required</h1>
        <p>We need more information about your club</p>
      </div>
      
      <div class="content">
        <h2>Hello ${contactName},</h2>
        
        <p>Thank you for your interest in joining ${platformName} with <strong>${clubName}</strong>.</p>
        
        <p>After reviewing your application, we need some additional information or updates before we can approve your club registration.</p>
        
        <div class="feedback-box">
          <h3>Feedback:</h3>
          <p>${rejectionReason}</p>
        </div>
        
        <h3>Next Steps:</h3>
        <ul>
          <li><strong>Review the feedback above</strong> and gather any additional information needed</li>
          <li><strong>Update your application</strong> with the requested changes or information</li>
          <li><strong>Resubmit your application</strong> once you've addressed the feedback</li>
        </ul>
        
        <p>We're here to help you through this process. If you have any questions about the feedback or need clarification on what's required, please don't hesitate to contact our support team.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://egsport.co.uk/register" class="button">Update Your Application</a>
        </div>
        
        <p>We appreciate your patience and look forward to welcoming ${clubName} to our community once the requirements are met.</p>
      </div>
      
      <div class="footer">
        <p>Questions? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        <p>This email was sent regarding your club application for ${clubName}.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
📋 Application Update Required

Dear ${contactName},

Thank you for your interest in joining ${platformName} with ${clubName}.

After reviewing your application, we need some additional information or updates before we can approve your club registration.

Feedback:
${rejectionReason}

Next Steps:
- Review the feedback above and gather any additional information needed
- Update your application with the requested changes or information  
- Resubmit your application once you've addressed the feedback

Update your application: https://egsport.co.uk/register

We're here to help you through this process. If you have any questions about the feedback or need clarification on what's required, please contact us at ${supportEmail}.

We appreciate your patience and look forward to welcoming ${clubName} to our community once the requirements are met.

Best regards,
The ${platformName} Team
  `;

  return { subject, html, text };
}

/**
 * Generate welcome email template for newly approved clubs
 */
export function generateWelcomeTemplate(data: ClubApplicationData): EmailTemplate {
  const {
    clubName,
    contactName = 'Club Administrator',
    loginUrl = 'https://egsport.co.uk/login',
    supportEmail = 'support@egsport.co.uk',
    platformName = 'EGSport'
  } = data;

  const subject = `🏆 Welcome to ${platformName} - ${clubName}!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${platformName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .feature-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 15px 0; }
        .welcome-icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="welcome-icon">🏆</div>
        <h1>Welcome to ${platformName}!</h1>
        <p>Your sports community journey begins now</p>
      </div>
      
      <div class="content">
        <h2>Hello ${contactName},</h2>
        
        <p>Welcome to ${platformName}! We're thrilled to have <strong>${clubName}</strong> as part of our growing sports community.</p>
        
        <p>Your club is now active on our platform, and you have access to all the tools and features designed to help you grow and manage your sports community.</p>
        
        <div class="feature-box">
          <h3>🎯 What You Can Do Now:</h3>
          <ul>
            <li><strong>Manage Your Club Profile:</strong> Update your description, add photos, and showcase what makes your club special</li>
            <li><strong>Create Events:</strong> Organize training sessions, matches, tournaments, and social events</li>
            <li><strong>Connect with Members:</strong> Invite existing members and recruit new ones</li>
            <li><strong>Network with Other Clubs:</strong> Discover and connect with other sports clubs in your area</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" class="button">Start Managing Your Club</a>
        </div>
        
        <div class="feature-box">
          <h3>🚀 Quick Start Guide:</h3>
          <ol>
            <li><strong>Complete Your Profile:</strong> Add your club logo, description, and contact details</li>
            <li><strong>Set Up Your First Event:</strong> Create a training session or social gathering</li>
            <li><strong>Invite Your Team:</strong> Send invitations to your existing members</li>
            <li><strong>Explore the Community:</strong> Browse other clubs and upcoming events</li>
          </ol>
        </div>
        
        <p>We're committed to helping you make the most of ${platformName}. Our support team is always here to help you succeed.</p>
        
        <p>Thank you for choosing ${platformName} for your club management needs. We can't wait to see ${clubName} thrive in our community!</p>
      </div>
      
      <div class="footer">
        <p>Need assistance? We're here to help at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        <p>Follow us for updates and tips on making the most of ${platformName}</p>
        <p>This welcome email was sent to ${clubName}.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
🏆 Welcome to ${platformName}!

Dear ${contactName},

Welcome to ${platformName}! We're thrilled to have ${clubName} as part of our growing sports community.

Your club is now active on our platform, and you have access to all the tools and features designed to help you grow and manage your sports community.

🎯 What You Can Do Now:
- Manage Your Club Profile: Update your description, add photos, and showcase what makes your club special
- Create Events: Organize training sessions, matches, tournaments, and social events
- Connect with Members: Invite existing members and recruit new ones
- Network with Other Clubs: Discover and connect with other sports clubs in your area

Start managing your club: ${loginUrl}

🚀 Quick Start Guide:
1. Complete Your Profile: Add your club logo, description, and contact details
2. Set Up Your First Event: Create a training session or social gathering
3. Invite Your Team: Send invitations to your existing members
4. Explore the Community: Browse other clubs and upcoming events

We're committed to helping you make the most of ${platformName}. Our support team is always here to help you succeed.

Thank you for choosing ${platformName} for your club management needs. We can't wait to see ${clubName} thrive in our community!

Need assistance? Contact us at ${supportEmail}

Best regards,
The ${platformName} Team
  `;

  return { subject, html, text };
}