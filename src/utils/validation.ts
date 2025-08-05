import { CMPConfig } from '@/types';

/**
 * Validation utilities for CMP configuration and data
 */

/**
 * Validate CMP configuration
 */
export function validateCMPConfig(config: Partial<CMPConfig>): string[] {
  const errors: string[] = [];

  if (!config.cmpId || config.cmpId <= 0) {
    errors.push('cmpId must be a positive number');
  }

  if (!config.cmpVersion || config.cmpVersion <= 0) {
    errors.push('cmpVersion must be a positive number');
  }

  if (config.cookieMaxAgeSeconds && config.cookieMaxAgeSeconds <= 0) {
    errors.push('cookieMaxAgeSeconds must be a positive number');
  }

  if (config.defaultLang && !/^[a-z]{2}$/.test(config.defaultLang)) {
    errors.push('defaultLang must be a valid 2-letter language code');
  }

  if (config.gvlLocation && !isValidUrl(config.gvlLocation)) {
    errors.push('gvlLocation must be a valid URL');
  }

  return errors;
}

/**
 * Validate TC String format
 */
export function validateTCString(tcString: string): boolean {
  if (!tcString || typeof tcString !== 'string') {
    return false;
  }

  // Basic TC String format validation
  // Real TC strings are base64url encoded and start with specific characters
  const tcStringPattern = /^[A-Za-z0-9_-]+$/;
  return tcStringPattern.test(tcString) && tcString.length > 20;
}

/**
 * Validate vendor ID
 */
export function validateVendorId(vendorId: number): boolean {
  return Number.isInteger(vendorId) && vendorId > 0;
}

/**
 * Validate purpose ID
 */
export function validatePurposeId(purposeId: number): boolean {
  return Number.isInteger(purposeId) && purposeId >= 1 && purposeId <= 10;
}

/**
 * Validate special feature ID
 */
export function validateSpecialFeatureId(featureId: number): boolean {
  return Number.isInteger(featureId) && featureId >= 1 && featureId <= 2;
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate consent object structure
 */
export function validateConsentObject(
  consents: { [key: number]: boolean }
): boolean {
  if (!consents || typeof consents !== 'object') {
    return false;
  }

  return Object.entries(consents).every(([key, value]) => {
    const numKey = parseInt(key, 10);
    return !isNaN(numKey) && numKey > 0 && typeof value === 'boolean';
  });
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Check if the current environment supports the required APIs
 */
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  if (typeof localStorage === 'undefined') {
    missing.push('localStorage');
  }

  if (typeof document.cookie === 'undefined') {
    missing.push('cookies');
  }

  if (typeof fetch === 'undefined') {
    missing.push('fetch API');
  }

  if (typeof JSON === 'undefined') {
    missing.push('JSON');
  }

  if (typeof Promise === 'undefined') {
    missing.push('Promise');
  }

  return {
    supported: missing.length === 0,
    missing
  };
}