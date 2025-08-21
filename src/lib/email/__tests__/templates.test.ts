/**
 * Email Templates Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  generateApprovalTemplate, 
  generateRejectionTemplate, 
  generateWelcomeTemplate,
  type ClubApplicationData 
} from '../templates';

describe('Email Templates', () => {
  const mockClubData: ClubApplicationData = {
    clubName: 'Test Football Club',
    contactEmail: 'test@example.com',
    contactName: 'John Doe',
    loginUrl: 'https://example.com/login',
    supportEmail: 'support@example.com',
    platformName: 'TestSport'
  };

  describe('generateApprovalTemplate', () => {
    it('should generate approval email template with correct data', () => {
      const template = generateApprovalTemplate(mockClubData);

      expect(template.subject).toContain('Test Football Club');
      expect(template.subject).toContain('Application Approved');
      expect(template.html).toContain('Test Football Club');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('https://example.com/login');
      expect(template.text).toContain('Test Football Club');
      expect(template.text).toContain('John Doe');
    });

    it('should use default values when optional fields are missing', () => {
      const minimalData = {
        clubName: 'Minimal Club',
        contactEmail: 'minimal@example.com'
      };

      const template = generateApprovalTemplate(minimalData);

      expect(template.html).toContain('Club Administrator');
      expect(template.html).toContain('https://egsport.co.uk/login');
      expect(template.html).toContain('support@egsport.co.uk');
      expect(template.html).toContain('EGSport');
    });

    it('should generate valid HTML structure', () => {
      const template = generateApprovalTemplate(mockClubData);

      expect(template.html).toContain('<!DOCTYPE html>');
      expect(template.html).toContain('<html>');
      expect(template.html).toContain('</html>');
      expect(template.html).toContain('<body>');
      expect(template.html).toContain('</body>');
    });
  });

  describe('generateRejectionTemplate', () => {
    it('should generate rejection email template with feedback', () => {
      const dataWithReason = {
        ...mockClubData,
        rejectionReason: 'Missing required documentation'
      };

      const template = generateRejectionTemplate(dataWithReason);

      expect(template.subject).toContain('Test Football Club');
      expect(template.subject).toContain('Application Update Required');
      expect(template.html).toContain('Missing required documentation');
      expect(template.text).toContain('Missing required documentation');
    });

    it('should use default rejection reason when not provided', () => {
      const template = generateRejectionTemplate(mockClubData);

      expect(template.html).toContain('did not meet our current requirements');
      expect(template.text).toContain('did not meet our current requirements');
    });

    it('should include reapplication guidance', () => {
      const template = generateRejectionTemplate(mockClubData);

      expect(template.html).toContain('Update Your Application');
      expect(template.html).toContain('Resubmit your application');
      expect(template.text).toContain('Resubmit your application');
    });
  });

  describe('generateWelcomeTemplate', () => {
    it('should generate welcome email template', () => {
      const template = generateWelcomeTemplate(mockClubData);

      expect(template.subject).toContain('Welcome to TestSport');
      expect(template.subject).toContain('Test Football Club');
      expect(template.html).toContain('Welcome to TestSport');
      expect(template.html).toContain('Test Football Club');
      expect(template.html).toContain('John Doe');
    });

    it('should include getting started guidance', () => {
      const template = generateWelcomeTemplate(mockClubData);

      expect(template.html).toContain('Quick Start Guide');
      expect(template.html).toContain('Complete Your Profile');
      expect(template.html).toContain('Create Events');
      expect(template.text).toContain('Quick Start Guide');
    });

    it('should include platform features', () => {
      const template = generateWelcomeTemplate(mockClubData);

      expect(template.html).toContain('What You Can Do Now');
      expect(template.html).toContain('Manage Your Club Profile');
      expect(template.html).toContain('Network with Other Clubs');
    });
  });

  describe('Template consistency', () => {
    it('should have consistent structure across all templates', () => {
      const approval = generateApprovalTemplate(mockClubData);
      const rejection = generateRejectionTemplate(mockClubData);
      const welcome = generateWelcomeTemplate(mockClubData);

      // All should have subject, html, and text
      [approval, rejection, welcome].forEach(template => {
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('html');
        expect(template).toHaveProperty('text');
        expect(typeof template.subject).toBe('string');
        expect(typeof template.html).toBe('string');
        expect(typeof template.text).toBe('string');
      });
    });

    it('should include support contact in all templates', () => {
      const approval = generateApprovalTemplate(mockClubData);
      const rejection = generateRejectionTemplate(mockClubData);
      const welcome = generateWelcomeTemplate(mockClubData);

      [approval, rejection, welcome].forEach(template => {
        expect(template.html).toContain('support@example.com');
        expect(template.text).toContain('support@example.com');
      });
    });

    it('should be mobile-friendly with responsive design', () => {
      const template = generateApprovalTemplate(mockClubData);

      expect(template.html).toContain('viewport');
      expect(template.html).toContain('max-width');
      expect(template.html).toContain('margin: 0 auto');
    });
  });
});