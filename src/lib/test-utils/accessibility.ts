/**
 * Accessibility Testing Utilities
 * Helper functions for testing accessibility features
 */

import { screen } from '@testing-library/react';

/**
 * Test utilities for accessibility compliance
 */
export const AccessibilityTestUtils = {
  /**
   * Check if element has proper ARIA labels
   */
  hasAccessibleName(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim()
    );
  },

  /**
   * Check if interactive elements are keyboard accessible
   */
  isKeyboardAccessible(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.getAttribute('tabindex');
    
    // Naturally focusable elements
    const naturallyFocusable = [
      'button', 'input', 'select', 'textarea', 'a'
    ].includes(tagName);
    
    // Elements with explicit tabindex
    const explicitlyFocusable = tabIndex !== null && tabIndex !== '-1';
    
    return naturallyFocusable || explicitlyFocusable;
  },

  /**
   * Check color contrast ratio meets WCAG standards
   */
  meetsContrastRequirements(ratio: number, level: 'AA' | 'AAA' = 'AA'): boolean {
    const minimumRatio = level === 'AAA' ? 7 : 4.5;
    return ratio >= minimumRatio;
  },

  /**
   * Find all interactive elements without accessible names
   */
  findInaccessibleElements(): HTMLElement[] {
    const interactiveSelectors = [
      'button', 'input', 'select', 'textarea', 'a[href]',
      '[role="button"]', '[role="link"]', '[role="menuitem"]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const elements = document.querySelectorAll(interactiveSelectors.join(', '));
    
    return Array.from(elements).filter(
      (element) => !this.hasAccessibleName(element as HTMLElement)
    ) as HTMLElement[];
  },

  /**
   * Check if form has proper labels
   */
  hasProperFormLabels(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    return Array.from(inputs).every((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      // Check for explicit label
      if (id) {
        const label = form.querySelector(`label[for="${id}"]`);
        if (label) return true;
      }
      
      // Check for ARIA labels
      if (ariaLabel || ariaLabelledBy) return true;
      
      // Check if input is wrapped in label
      const parentLabel = input.closest('label');
      if (parentLabel) return true;
      
      return false;
    });
  },

  /**
   * Check if headings follow proper hierarchy
   */
  hasProperHeadingHierarchy(): boolean {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of headings) {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      // First heading should be h1
      if (previousLevel === 0 && currentLevel !== 1) {
        return false;
      }
      
      // Headings should not skip levels
      if (currentLevel > previousLevel + 1) {
        return false;
      }
      
      previousLevel = currentLevel;
    }
    
    return true;
  },

  /**
   * Check if images have alt text
   */
  hasProperImageAltText(): boolean {
    const images = document.querySelectorAll('img');
    
    return Array.from(images).every((img) => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      
      // Decorative images should have empty alt or role="presentation"
      if (role === 'presentation' || alt === '') {
        return true;
      }
      
      // Content images should have meaningful alt text
      return alt !== null && alt.trim().length > 0;
    });
  },

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(container: HTMLElement): Promise<boolean> {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return true;
    
    // Test Tab navigation
    let currentIndex = 0;
    for (const element of focusableElements) {
      (element as HTMLElement).focus();
      
      if (document.activeElement !== element) {
        return false;
      }
      
      currentIndex++;
    }
    
    return true;
  },

  /**
   * Check for skip links
   */
  hasSkipLinks(): boolean {
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    
    return Array.from(skipLinks).some((link) => {
      const text = link.textContent?.toLowerCase() || '';
      return text.includes('skip') && (
        text.includes('content') || 
        text.includes('main') || 
        text.includes('navigation')
      );
    });
  },

  /**
   * Comprehensive accessibility audit
   */
  auditAccessibility(): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for inaccessible elements
    const inaccessibleElements = this.findInaccessibleElements();
    if (inaccessibleElements.length > 0) {
      issues.push(`${inaccessibleElements.length} interactive elements lack accessible names`);
    }
    
    // Check heading hierarchy
    if (!this.hasProperHeadingHierarchy()) {
      issues.push('Improper heading hierarchy detected');
    }
    
    // Check image alt text
    if (!this.hasProperImageAltText()) {
      issues.push('Images missing proper alt text');
    }
    
    // Check forms
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      if (!this.hasProperFormLabels(form as HTMLFormElement)) {
        issues.push('Form inputs missing proper labels');
        break;
      }
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }
};

/**
 * Custom Jest matchers for accessibility testing
 */
export const accessibilityMatchers = {
  toBeAccessible(received: HTMLElement) {
    const audit = AccessibilityTestUtils.auditAccessibility();
    
    return {
      pass: audit.passed,
      message: () => 
        audit.passed 
          ? `Expected element to fail accessibility audit`
          : `Accessibility issues found: ${audit.issues.join(', ')}`
    };
  },

  toHaveAccessibleName(received: HTMLElement) {
    const hasName = AccessibilityTestUtils.hasAccessibleName(received);
    
    return {
      pass: hasName,
      message: () => 
        hasName
          ? `Expected element to not have accessible name`
          : `Expected element to have accessible name (aria-label, aria-labelledby, or text content)`
    };
  },

  toBeKeyboardAccessible(received: HTMLElement) {
    const isAccessible = AccessibilityTestUtils.isKeyboardAccessible(received);
    
    return {
      pass: isAccessible,
      message: () =>
        isAccessible
          ? `Expected element to not be keyboard accessible`
          : `Expected element to be keyboard accessible (focusable)`
    };
  }
};