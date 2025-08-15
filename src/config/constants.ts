/**
 * TCF 2.2 Constants and Configuration
 */

export const TCF_VERSION = '2.2';
export const TCF_POLICY_VERSION = 4;

// Default CMP configuration values
export const DEFAULT_CMP_ID = 123; // Development CMP ID - replace with your registered CMP ID for production
export const DEFAULT_CMP_VERSION = 1;
export const DEFAULT_COOKIE_MAX_AGE = 33696000; // 13 months in seconds

// GVL (Global Vendor List) Configuration
export const DEFAULT_GVL_URL = 'https://cdn.trydatacops.com/v3/vendor-list.json';
// export const DEFAULT_GVL_URL = 'https://vendor-list.consensu.org/v2/vendor-list.json';
export const GVL_CACHE_DURATION = 86400000; // 24 hours in milliseconds

// Storage keys
export const STORAGE_KEYS = {
  CONSENT_COOKIE: 'euconsent-v2',
  CONSENT_DATA: 'tcf_consent_data',
  GVL_CACHE: 'tcf_gvl_cache'
} as const;

// Purpose IDs as defined by IAB TCF
export const PURPOSE_IDS = {
  STORE_ACCESS_INFO: 1,
  BASIC_ADS: 2,
  PERSONALIZED_ADS: 3,
  AD_MEASUREMENT: 4,
  CONTENT_MEASUREMENT: 5,
  MARKET_RESEARCH: 6,
  PERSONALIZED_CONTENT: 7,
  PRECISE_GEOLOCATION: 8,
  DEVICE_SCANNING: 9,
  SECURE_TRANSMISSION: 10
} as const;

// Special Feature IDs
export const SPECIAL_FEATURE_IDS = {
  PRECISE_GEOLOCATION: 1,
  DEVICE_SCANNING: 2
} as const;

// Vendor List specification versions
export const VENDOR_LIST_VERSION = 3;

// UI Configuration
export const UI_DEFAULTS = {
  THEME: 'light' as const,
  POSITION: 'bottom' as const,
  PRIMARY_COLOR: '#1f56e3',
  SHOW_VENDOR_COUNT: true,
  SHOW_PURPOSE_DESCRIPTIONS: true
} as const;

// Language codes supported by default
export const SUPPORTED_LANGUAGES = [
  'en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'sv', 'da', 'no', 'fi'
] as const;

// Error messages
export const ERROR_MESSAGES = {
  GVL_LOAD_FAILED: 'Failed to load Global Vendor List',
  CONSENT_SAVE_FAILED: 'Failed to save consent data',
  INVALID_CONFIG: 'Invalid CMP configuration',
  API_NOT_AVAILABLE: 'TCF API is not available'
} as const;

// Event types
export const EVENT_TYPES = {
  READY: 'tcfapi:ready',
  CONSENT_CHANGED: 'tcfapi:consentchanged',
  UI_SHOWN: 'tcfapi:uishown',
  UI_HIDDEN: 'tcfapi:uihidden',
  ERROR: 'tcfapi:error'
} as const;