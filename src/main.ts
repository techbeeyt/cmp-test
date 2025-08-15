import { CMPCore } from '@/core/CMPCore';
import { ConsentUI } from '@/ui/ConsentUI';
import { CMPConfig, CMPCallbacks } from '@/types';
import '@/stub/tcfapi-stub'; // Import stub API to initialize it early

// Development mode indicator
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 TCF CMP Development Mode Active - Hot Module Replacement Enabled');
  console.log('📝 Last updated:', new Date().toLocaleTimeString());
}

// Default configuration
const DEFAULT_CONFIG: CMPConfig = {
  cmpId: 123, // Development CMP ID - replace with your registered CMP ID for production
  cmpVersion: 1,
  cookieMaxAgeSeconds: 33696000, // 13 months
  defaultLang: 'en',
  storeConsentGlobally: false,
  uiOptions: {
    theme: 'light',
    position: 'bottom',
    primaryColor: '#1f56e3',
    showVendorCount: true,
    showPurposeDescriptions: true
  }
};

/**
 * Main CMP class that orchestrates all components
 */
class TCFCMP {
  private cmpCore: CMPCore;
  private consentUI: ConsentUI;
  private config: CMPConfig;

  constructor(config: Partial<CMPConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    const callbacks: CMPCallbacks = {
      onCMPUIShown: () => this.consentUI.show(),
      onCMPUIHidden: () => this.consentUI.hide(),
      onConsentChanged: (tcData) => {
        console.log('Consent updated:', tcData);
        // Emit custom event for website integration
        window.dispatchEvent(new CustomEvent('tcfapi:consentchanged', { 
          detail: tcData 
        }));
      },
      onError: (error) => {
        console.error('CMP Error:', error);
        // Emit error event
        window.dispatchEvent(new CustomEvent('tcfapi:error', { 
          detail: error 
        }));
      }
    };

    this.cmpCore = new CMPCore(this.config, callbacks);
    this.consentUI = new ConsentUI(this.cmpCore, this.config.uiOptions);

    // Initialize the CMP
    this.initialize();
  }

  /**
   * Initialize the CMP
   */
  private async initialize(): Promise<void> {
    try {
      // Listen for state changes to show/hide UI
      const checkState = () => {
        const state = this.cmpCore.getState();
        if (state.cmpDisplayStatus === 'visible') {
          this.consentUI.show();
        } else if (state.cmpDisplayStatus === 'hidden') {
          this.consentUI.hide();
        }
      };

      // Check state periodically (in a real implementation, this would be event-driven)
      setInterval(checkState, 1000);

      console.log('TCF CMP initialized successfully');
      
      // Emit ready event
      window.dispatchEvent(new CustomEvent('tcfapi:ready'));
      
    } catch (error) {
      console.error('Failed to initialize CMP:', error);
    }
  }

  /**
   * Get the CMP core instance
   */
  public getCore(): CMPCore {
    return this.cmpCore;
  }

  /**
   * Get the consent UI instance
   */
  public getUI(): ConsentUI {
    return this.consentUI;
  }

  /**
   * Show the consent UI manually
   */
  public showUI(): void {
    this.consentUI.show();
  }

  /**
   * Hide the consent UI manually
   */
  public hideUI(): void {
    this.consentUI.hide();
  }

  /**
   * Clear all consent data and show UI again
   */
  public resetConsent(): void {
    this.cmpCore.clearConsent();
  }

  /**
   * Get current consent data
   */
  public async getConsentData() {
    return await this.cmpCore.getTCData();
  }
}

// Global initialization
declare global {
  interface Window {
    TCFCMP: typeof TCFCMP;
    tcfCMPInstance?: TCFCMP;
  }
}

// Export the CMP class for programmatic usage
window.TCFCMP = TCFCMP;

// Auto-initialize if configuration is provided
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  const initializeCMP = () => {
    // Look for configuration in window object or data attributes
    const configScript = document.querySelector('script[data-cmp-config]');
    let config: Partial<CMPConfig> = {};

    if (configScript) {
      try {
        const configData = configScript.getAttribute('data-cmp-config');
        if (configData) {
          config = JSON.parse(configData);
        }
      } catch (error) {
        console.warn('Invalid CMP configuration:', error);
      }
    }

    // Check for global configuration
    if ((window as any).TCF_CMP_CONFIG) {
      config = { ...config, ...(window as any).TCF_CMP_CONFIG };
    }

    // Initialize the CMP
    window.tcfCMPInstance = new TCFCMP(config);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCMP);
  } else {
    initializeCMP();
  }
}

export { TCFCMP };