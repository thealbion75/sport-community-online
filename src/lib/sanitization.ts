/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input and prevent XSS attacks
 */

// HTML sanitization - removes potentially dangerous HTML tags and attributes
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous HTML tags
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 
    'button', 'select', 'option', 'link', 'meta', 'style', 'base'
  ];
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
  
  return sanitized.trim();
}

// Text sanitization - removes HTML tags completely
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`');
  
  return sanitized.trim();
}

// Email sanitization
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = sanitizeText(sanitized);
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

// Phone number sanitization
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+');
    sanitized = '+' + parts.join('');
  }
  
  return sanitized;
}

// URL sanitization
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  let sanitized = url.trim();
  
  // Remove HTML tags
  sanitized = sanitizeText(sanitized);
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = sanitized.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Add https:// if no protocol is specified
  if (sanitized && !sanitized.match(/^https?:\/\//)) {
    sanitized = 'https://' + sanitized;
  }
  
  return sanitized;
}

// Filename sanitization
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
}

// SQL injection prevention (for display purposes - actual queries should use parameterized queries)
export function sanitizeSqlString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Escape single quotes
  let sanitized = input.replace(/'/g, "''");
  
  // Remove SQL keywords that could be dangerous
  const sqlKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'EXEC', 'EXECUTE',
    'UNION', 'SELECT', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT'
  ];
  
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
}

// General purpose sanitization for user input
export function sanitizeUserInput(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  removeNewlines?: boolean;
} = {}): string {
  if (!input || typeof input !== 'string') return '';
  
  const { allowHtml = false, maxLength = 10000, removeNewlines = false } = options;
  
  let sanitized = allowHtml ? sanitizeHtml(input) : sanitizeText(input);
  
  if (removeNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Sanitize object properties recursively
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    removeNewlines?: boolean;
  } = {}
): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeUserInput(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeUserInput(item, options) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, options);
    }
  }
  
  return sanitized;
}