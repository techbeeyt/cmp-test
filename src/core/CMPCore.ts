import { TCModel, TCString } from '@iabtcf/core';
import { TCData, CmpStatus, EventStatus as IABEventStatus } from '@iabtcf/cmpapi';
import { StorageManager } from '@/storage/StorageManager';
import { GVLManager } from '@/gvl/GVLManager';
import { 
  CMPConfig, 
  CMPState, 
  ConsentData, 
  CMPCallbacks,
  CMPDisplayStatus,
  EventStatus,
  SignalStatus
} from '@/types';

export class CMPCore {
  private config: CMPConfig;
  private state: CMPState;
  private callbacks: CMPCallbacks;
  private storageManager: StorageManager;
  private gvlManager: GVLManager;
  // private _cmpApi: CmpApi | null = null; // Reserved for future use
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(config: CMPConfig, callbacks: CMPCallbacks = {}) {
    this.config = {
      cookieMaxAgeSeconds: 33696000, // 13 months
      defaultLang: 'en',
      storeConsentGlobally: false,
      ...config
    };
    
    this.callbacks = callbacks;
    this.storageManager = new StorageManager(this.config.cookieMaxAgeSeconds);
    this.gvlManager = new GVLManager(this.config.gvlLocation);
    
    this.state = {
      gdprApplies: this.determineGDPRApplies(),
      cmpLoaded: false,
      cmpDisplayStatus: CMPDisplayStatus.HIDDEN,
      signalStatus: SignalStatus.NOT_READY,
      eventStatus: EventStatus.TC_LOADED,
      isAMP: this.detectAMP()
    };

    this.initialize();
  }

  /**
   * Initialize the CMP
   */
  private async initialize(): Promise<void> {
    try {
      this.state.signalStatus = SignalStatus.LOADING;
      
      // Initialize CMP API immediately
      this.initializeCMPAPI();
      
      // Load the GVL (don't let this fail the entire initialization)
      try {
        await this.gvlManager.getGVL();
      } catch (gvlError) {
        console.warn('Failed to load GVL, continuing with CMP initialization:', gvlError);
      }
      
      // Check for existing consent
      const existingConsent = this.storageManager.getConsentData();
      const tcString = this.storageManager.getTCString();
      
      if (existingConsent && tcString && !this.storageManager.isConsentExpired()) {
        // Valid existing consent
        this.state.tcString = tcString;
        this.state.tcfPolicyVersion = existingConsent.tcfPolicyVersion;
        this.state.cmpId = existingConsent.cmpId;
        this.state.cmpVersion = existingConsent.cmpVersion;
        this.state.signalStatus = SignalStatus.READY;
        this.state.eventStatus = EventStatus.TC_LOADED;
      } else {
        // No valid consent, need to show UI
        this.state.signalStatus = SignalStatus.READY;
        this.state.cmpDisplayStatus = CMPDisplayStatus.VISIBLE;
        this.state.eventStatus = EventStatus.CMP_UI_SHOWN;
        this.showConsentUI();
      }
      
      this.state.cmpLoaded = true;
      this.notifyStateChange();
      
    } catch (error) {
      console.error('CMP initialization failed:', error);
      this.callbacks.onError?.(error as Error);
      this.state.signalStatus = SignalStatus.READY;
      this.state.cmpDisplayStatus = CMPDisplayStatus.DISABLED;
    }
  }

  /**
   * Initialize the TCF CMP API
   */
  private initializeCMPAPI(): void {
    try {
      // this._cmpApi = new CmpApi(this.config.cmpId, this.config.cmpVersion); // Reserved for future use
      
      // Expose the __tcfapi function globally
      (window as any).__tcfapi = this.handleTCFAPICall.bind(this);
    } catch (error) {
      console.error('Failed to initialize CMP API:', error);
      // Fallback: expose a basic __tcfapi implementation
      (window as any).__tcfapi = this.handleTCFAPICall.bind(this);
    }
  }

  /**
   * Handle __tcfapi calls
   */
  private handleTCFAPICall(command: string, version: number, callback: Function, parameter?: any): void {
    switch (command) {
      case 'getTCData':
        this.handleGetTCData(version, callback, parameter);
        break;
      case 'ping':
        this.handlePing(version, callback);
        break;
      case 'addEventListener':
        this.handleAddEventListener(version, callback, parameter);
        break;
      case 'removeEventListener':
        this.handleRemoveEventListener(version, callback, parameter);
        break;
      default:
        if (callback && typeof callback === 'function') {
          callback(null, false);
        }
    }
  }

  /**
   * Handle getTCData command
   */
  private handleGetTCData(_version: number, callback: Function, parameter?: any): void {
    const tcData: Partial<TCData> = {
      tcString: this.state.tcString || '',
      tcfPolicyVersion: this.state.tcfPolicyVersion || 2,
      cmpId: this.config.cmpId,
      cmpVersion: this.config.cmpVersion,
      cmpStatus: this.mapSignalStatusToCmpStatus(this.state.signalStatus),
      isServiceSpecific: !this.config.storeConsentGlobally,
      useNonStandardStacks: false,
      purposeOneTreatment: false,
      publisherCC: this.detectPublisherCountryCode(),
      eventStatus: this.mapEventStatus(this.state.eventStatus),
      gdprApplies: this.state.gdprApplies,
      listenerId: parameter?.listenerId
    };

    if (callback && typeof callback === 'function') {
      callback(tcData as TCData, true);
    }
  }

  /**
   * Handle ping command
   */
  private handlePing(_version: number, callback: Function): void {
    const pingData = {
      gdprApplies: this.state.gdprApplies,
      cmpLoaded: this.state.cmpLoaded,
      cmpStatus: this.mapSignalStatusToCmpStatus(this.state.signalStatus),
      apiVersion: '2.2',
      cmpVersion: this.config.cmpVersion,
      cmpId: this.config.cmpId,
      gvlVersion: 0, // Will be updated when GVL is loaded
      tcfPolicyVersion: 2
    };

    if (callback && typeof callback === 'function') {
      callback(pingData, true);
    }
  }

  /**
   * Handle addEventListener command
   */
  private handleAddEventListener(version: number, callback: Function, _parameter?: any): void {
    const listenerId = this.generateListenerId();
    
    if (!this.eventListeners.has('tcloaded')) {
      this.eventListeners.set('tcloaded', new Set());
    }
    
    this.eventListeners.get('tcloaded')!.add(callback);
    
    // Immediately call with current state
    this.handleGetTCData(version, callback, { listenerId });
  }

  /**
   * Handle removeEventListener command
   */
  private handleRemoveEventListener(_version: number, callback: Function, _parameter?: any): void {
    // const _listenerId = parameter?.listenerId; // Reserved for future use
    
    this.eventListeners.forEach((listeners) => {
      listeners.delete(callback);
    });

    if (callback && typeof callback === 'function') {
      callback({ success: true }, true);
    }
  }

  /**
   * Save user consent choices
   */
  public async saveConsent(
    purposeConsents: { [key: number]: boolean },
    vendorConsents: { [key: number]: boolean },
    specialFeatureOptins: { [key: number]: boolean } = {},
    legitimateInterests: { [key: number]: boolean } = {}
  ): Promise<void> {
    try {
      // const _gvl = await this.gvlManager.getGVL(); // Reserved for future use
      
      // Create TCModel
      const tcModel = new TCModel();
      tcModel.created = new Date();
      tcModel.lastUpdated = new Date();
      tcModel.cmpId = this.config.cmpId;
      tcModel.cmpVersion = this.config.cmpVersion;
      tcModel.policyVersion = 2;
      tcModel.isServiceSpecific = !this.config.storeConsentGlobally;
      tcModel.useNonStandardStacks = false;
      tcModel.purposeOneTreatment = false;
      tcModel.publisherCountryCode = this.detectPublisherCountryCode();

      // Set purpose consents
      Object.entries(purposeConsents).forEach(([purposeId, consent]) => {
        if (consent) {
          tcModel.purposeConsents.set(parseInt(purposeId));
        } else {
          tcModel.purposeConsents.unset(parseInt(purposeId));
        }
      });

      // Set vendor consents
      Object.entries(vendorConsents).forEach(([vendorId, consent]) => {
        if (consent) {
          tcModel.vendorConsents.set(parseInt(vendorId));
        } else {
          tcModel.vendorConsents.unset(parseInt(vendorId));
        }
      });

      // Set special feature opt-ins
      Object.entries(specialFeatureOptins).forEach(([featureId, optin]) => {
        if (optin) {
          tcModel.specialFeatureOptins.set(parseInt(featureId));
        } else {
          tcModel.specialFeatureOptins.unset(parseInt(featureId));
        }
      });

      // Set legitimate interests
      Object.entries(legitimateInterests).forEach(([purposeId, interest]) => {
        if (interest) {
          tcModel.purposeLegitimateInterests.set(parseInt(purposeId));
        } else {
          tcModel.purposeLegitimateInterests.unset(parseInt(purposeId));
        }
      });

      const encodedTCString = TCString.encode(tcModel);

      // Create consent data object
      const consentData: ConsentData = {
        tcString: encodedTCString,
        tcfPolicyVersion: 2,
        cmpId: this.config.cmpId,
        cmpVersion: this.config.cmpVersion,
        created: tcModel.created,
        lastUpdated: tcModel.lastUpdated,
        isServiceSpecific: tcModel.isServiceSpecific,
        useNonStandardStacks: tcModel.useNonStandardStacks,
        purposeOneTreatment: tcModel.purposeOneTreatment,
        publisherCC: tcModel.publisherCountryCode
      };

      // Store consent
      this.storageManager.storeConsent(encodedTCString, consentData);

      // Update state
      this.state.tcString = encodedTCString;
      this.state.tcfPolicyVersion = 2;
      this.state.cmpId = this.config.cmpId;
      this.state.cmpVersion = this.config.cmpVersion;
      this.state.cmpDisplayStatus = CMPDisplayStatus.HIDDEN;
      this.state.eventStatus = EventStatus.USER_ACTION_COMPLETE;

      // Hide UI
      this.hideConsentUI();

      // Notify callbacks
      this.callbacks.onConsentChanged?.(await this.getTCData() as TCData);
      this.notifyStateChange();

    } catch (error) {
      console.error('Failed to save consent:', error);
      throw error;
    }
  }

  /**
   * Get current TC data
   */
  public async getTCData(): Promise<Partial<TCData>> {
    const tcData: Partial<TCData> = {
      tcString: this.state.tcString || '',
      tcfPolicyVersion: this.state.tcfPolicyVersion || 2,
      cmpId: this.config.cmpId,
      cmpVersion: this.config.cmpVersion,
      cmpStatus: this.mapSignalStatusToCmpStatus(this.state.signalStatus),
      isServiceSpecific: !this.config.storeConsentGlobally,
      useNonStandardStacks: false,
      purposeOneTreatment: false,
      publisherCC: this.detectPublisherCountryCode(),
      eventStatus: this.mapEventStatus(this.state.eventStatus),
      gdprApplies: this.state.gdprApplies
    };

    return tcData;
  }

  /**
   * Show consent UI
   */
  private showConsentUI(): void {
    this.state.cmpDisplayStatus = CMPDisplayStatus.VISIBLE;
    this.state.eventStatus = EventStatus.CMP_UI_SHOWN;
    this.callbacks.onCMPUIShown?.();
  }

  /**
   * Hide consent UI
   */
  private hideConsentUI(): void {
    this.state.cmpDisplayStatus = CMPDisplayStatus.HIDDEN;
    this.callbacks.onCMPUIHidden?.();
  }

  /**
   * Determine if GDPR applies
   */
  private determineGDPRApplies(): boolean {
    // In a real implementation, this would check the user's location
    // For now, we'll assume GDPR applies
    return true;
  }

  /**
   * Detect if running in AMP
   */
  private detectAMP(): boolean {
    return !!(window as any).context?.amp;
  }

  /**
   * Detect publisher country code
   */
  private detectPublisherCountryCode(): string {
    // In a real implementation, this would detect the actual country
    return 'US';
  }

  /**
   * Generate unique listener ID
   */
  private generateListenerId(): number {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Notify all event listeners of state changes
   */
  private notifyStateChange(): void {
    this.eventListeners.forEach((listeners, _eventType) => {
      listeners.forEach(callback => {
        if (typeof callback === 'function') {
          this.handleGetTCData(2, callback);
        }
      });
    });
  }

  /**
   * Clear all consent data
   */
  public clearConsent(): void {
    this.storageManager.clearConsent();
    this.state.tcString = undefined;
    this.state.cmpDisplayStatus = CMPDisplayStatus.VISIBLE;
    this.state.eventStatus = EventStatus.CMP_UI_SHOWN;
    this.showConsentUI();
    this.notifyStateChange();
  }

  /**
   * Get the current CMP state
   */
  public getState(): CMPState {
    return { ...this.state };
  }

  /**
   * Get the GVL manager
   */
  public getGVLManager(): GVLManager {
    return this.gvlManager;
  }

  /**
   * Map internal signal status to CmpStatus enum
   */
  private mapSignalStatusToCmpStatus(signalStatus: string): CmpStatus {
    switch (signalStatus) {
      case 'not ready':
        return CmpStatus.STUB;
      case 'loading':
        return CmpStatus.LOADING;
      case 'ready':
        return CmpStatus.LOADED;
      default:
        return CmpStatus.ERROR;
    }
  }

  // Display status mapping removed as it's not part of TCData

  /**
   * Map internal event status to EventStatus enum
   */
  private mapEventStatus(eventStatus: string): IABEventStatus {
    switch (eventStatus) {
      case 'tcloaded':
        return IABEventStatus.TC_LOADED;
      case 'cmpuishown':
        return IABEventStatus.CMP_UI_SHOWN;
      case 'useractioncomplete':
        return IABEventStatus.USER_ACTION_COMPLETE;
      default:
        return IABEventStatus.TC_LOADED;
    }
  }
}