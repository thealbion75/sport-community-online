/**
 * Accessibility Utilities
 * Helper functions and utilities for improving accessibility
 */

/**
 * Generates accessible IDs for form elements
 */
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Manages focus for modal dialogs and overlays
 */
export class FocusManager {
  private previousActiveElement: Element | null = null;
  private focusableElements: NodeListOf<Element> | null = null;

  /**
   * Trap focus within a container element
   */
  trapFocus(container: HTMLElement) {
    this.previousActiveElement = document.activeElement;
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = container.querySelectorAll(focusableSelectors);
    
    if (this.focusableElements.length > 0) {
      (this.focusableElements[0] as HTMLElement).focus();
    }

    container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Release focus trap and return focus to previous element
   */
  releaseFocus(container: HTMLElement) {
    container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    if (this.previousActiveElement && this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
    
    this.previousActiveElement = null;
    this.focusableElements = null;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !this.focusableElements) return;

    const firstElement = this.focusableElements[0] as HTMLElement;
    const lastElement = this.focusableElements[this.focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Announces messages to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Checks if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.getAttribute('aria-hidden') === 'true'
  );
}

/**
 * Validates color contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in lists
   */
  handleArrowKeys(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    items[newIndex]?.focus();
  },

  /**
   * Handle Enter and Space key activation
   */
  handleActivation(event: KeyboardEvent, callback: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
};

/**
 * ARIA helpers
 */
export const ARIA = {
  /**
   * Set expanded state for collapsible elements
   */
  setExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', expanded.toString());
  },

  /**
   * Set selected state for selectable elements
   */
  setSelected(element: HTMLElement, selected: boolean) {
    element.setAttribute('aria-selected', selected.toString());
  },

  /**
   * Set pressed state for toggle buttons
   */
  setPressed(element: HTMLElement, pressed: boolean) {
    element.setAttribute('aria-pressed', pressed.toString());
  },

  /**
   * Associate label with control
   */
  associateLabel(control: HTMLElement, label: HTMLElement) {
    const labelId = label.id || generateId('label');
    label.id = labelId;
    control.setAttribute('aria-labelledby', labelId);
  },

  /**
   * Associate description with control
   */
  associateDescription(control: HTMLElement, description: HTMLElement) {
    const descId = description.id || generateId('desc');
    description.id = descId;
    control.setAttribute('aria-describedby', descId);
  }
};