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
  private gvl: any = null; // Current GVL instance
  // private _cmpApi: CmpApi | null = null; // Reserved for future use
  private eventListeners: Map<string, Map<number, Function>> = new Map();

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
        this.gvl = await this.gvlManager.getGVL();
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
      // Check if there's a stub API with queued calls
      const queuedCalls = (window as any).__tcfapiBuffer || [];
      
      // Replace stub with full implementation
      (window as any).__tcfapi = this.handleTCFAPICall.bind(this);
      
      // Set up postMessage handler for iframe communication
      this.setupPostMessageHandler();
      
      // Notify stub that full CMP is ready and process queued calls
      if (typeof (window as any).__tcfapiStubReady === 'function') {
        (window as any).__tcfapiStubReady(this.handleTCFAPICall.bind(this));
      } else {
        // Fallback: manually process queued calls
        queuedCalls.forEach((call: any) => {
          try {
            this.handleTCFAPICall(call.command, call.version, call.callback, call.parameter);
          } catch (error) {
            console.error('Error processing queued call:', error);
            if (call.callback) {
              call.callback(null, false);
            }
          }
        });
        
        // Clear the buffer
        (window as any).__tcfapiBuffer = [];
      }
      
      (window as any).__tcfapiReady = true;
      
      console.log('TCF CMP API initialized, processed', queuedCalls.length, 'queued calls');
      
    } catch (error) {
      console.error('Failed to initialize CMP API:', error);
      // Fallback: expose a basic __tcfapi implementation
      (window as any).__tcfapi = this.handleTCFAPICall.bind(this);
    }
  }

  /**
   * Set up postMessage handler for iframe communication
   */
  private setupPostMessageHandler(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (!data.__tcfapiCall) {
          return;
        }

        const { command, version, parameter, callId } = data.__tcfapiCall;

        // Create callback that sends response via postMessage
        const callback = (returnValue: any, success: boolean) => {
          const responseData = {
            __tcfapiReturn: {
              returnValue,
              success,
              callId
            }
          };

          try {
            (event.source as Window)?.postMessage(responseData, event.origin);
          } catch (error) {
            console.error('Failed to send postMessage response:', error);
          }
        };

        // Call __tcfapi with the postMessage callback
        this.handleTCFAPICall(command, version, callback, parameter);
        
      } catch (error) {
        console.error('Error handling postMessage:', error);
      }
    }, false);
  }

  /**
   * Handle __tcfapi calls
   */
  private handleTCFAPICall(command: string, version: number, callback: Function, parameter?: any): void {
    // Validate version parameter
    if (!this.isValidVersion(version)) {
      if (callback && typeof callback === 'function') {
        callback(null, false);
      }
      return;
    }

    // Validate callback
    if (!callback || typeof callback !== 'function') {
      console.warn('TCF API: Invalid callback provided for command:', command);
      return;
    }

    switch (command) {
      case 'getTCData':
        console.warn('getTCData is deprecated in TCF 2.2. Use addEventListener instead.');
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
      case 'getVendorList':
        this.handleGetVendorList(version, callback, parameter);
        break;
      case 'getInAppTCData':
        this.handleGetInAppTCData(version, callback, parameter);
        break;
      default:
        console.warn('TCF API: Unsupported command:', command);
        callback(null, false);
    }
  }

  /**
   * Validate version parameter according to TCF 2.2 spec
   */
  private isValidVersion(version: number): boolean {
    // Version must be a positive integer greater than 1
    // Version 1 is no longer supported
    // If version is 0, null, or undefined, use latest version
    if (version === 0 || version == null) {
      return true; // Use latest version
    }
    
    if (version === 1) {
      return false; // TCF v1 no longer supported
    }
    
    return Number.isInteger(version) && version > 1;
  }

  /**
   * Handle getTCData command (deprecated in TCF 2.2)
   */
  private async handleGetTCData(_version: number, callback: Function, parameter?: any): Promise<void> {
    try {
      const tcData = await this.buildTCData();
      tcData.listenerId = parameter?.listenerId;
      
      callback(tcData, true);
    } catch (error) {
      console.error('Error in getTCData:', error);
      callback(null, false);
    }
  }

  /**
   * Handle getVendorList command
   */
  private async handleGetVendorList(
    _version: number,
    callback: Function,
    parameter?: any
  ): Promise<void> {
    try {
      let vendorListVersion = parameter;
  
      if (vendorListVersion === 'LATEST' || vendorListVersion == null) {
        vendorListVersion = 'LATEST';
      } else if (typeof vendorListVersion === 'string') {
        const parsed = parseInt(vendorListVersion);
        if (isNaN(parsed) || parsed < 1) {
          callback(null, false);
          return;
        }
        vendorListVersion = parsed;
      } else if (typeof vendorListVersion !== 'number' || vendorListVersion < 1) {
        callback(null, false);
        return;
      }
  
      const gvl = await this.gvlManager.getGVL(vendorListVersion);
  
      // ensure safe postMessage transfer
      const safeGVL = JSON.parse(JSON.stringify(gvl));
  
      callback(safeGVL, true);
  
    } catch (error) {
      console.error('Error getting vendor list:', error);
      callback(null, false);
    }
  }

  
  /**
   * Handle getInAppTCData command
   */
  private async handleGetInAppTCData(_version: number, callback: Function, _parameter?: any): Promise<void> {
    try {
      const tcData = await this.buildTCData();
      
      // Convert to InAppTCData format (numbers instead of booleans)
      const inAppTCData = {
        tcString: tcData.tcString,
        tcfPolicyVersion: tcData.tcfPolicyVersion,
        cmpId: tcData.cmpId,
        cmpVersion: tcData.cmpVersion,
        gdprApplies: tcData.gdprApplies ? 1 : 0,
        eventStatus: tcData.eventStatus,
        isServiceSpecific: tcData.isServiceSpecific ? 1 : 0,
        useNonStandardTexts: tcData.useNonStandardTexts ? 1 : 0,
        publisherCC: tcData.publisherCC,
        purposeOneTreatment: tcData.purposeOneTreatment ? 1 : 0,
        purpose: {
          consents: this.convertBooleanMapToBitfield(tcData.purpose?.consents || {}),
          legitimateInterests: this.convertBooleanMapToBitfield(tcData.purpose?.legitimateInterests || {})
        },
        vendor: {
          consents: this.convertBooleanMapToBitfield(tcData.vendor?.consents || {}),
          legitimateInterests: this.convertBooleanMapToBitfield(tcData.vendor?.legitimateInterests || {})
        },
        specialFeatureOptins: this.convertBooleanMapToBitfield(tcData.specialFeatureOptins || {}),
        publisher: {
          consents: this.convertBooleanMapToBitfield(tcData.publisher?.consents || {}),
          legitimateInterests: this.convertBooleanMapToBitfield(tcData.publisher?.legitimateInterests || {}),
          customPurpose: {
            consents: this.convertBooleanMapToBitfield(tcData.publisher?.customPurpose?.consents || {}),
            legitimateInterests: this.convertBooleanMapToBitfield(tcData.publisher?.customPurpose?.legitimateInterests || {})
          },
          restrictions: this.convertRestrictionsToInAppFormat(tcData.publisher?.restrictions || {})
        }
      };
      
      callback(inAppTCData, true);
      
    } catch (error) {
      console.error('Error getting in-app TC data:', error);
      callback(null, false);
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
      displayStatus: this.mapDisplayStatus(this.state.cmpDisplayStatus),
      apiVersion: '2.2',
      cmpVersion: this.config.cmpVersion,
      cmpId: this.config.cmpId,
      gvlVersion: this.gvl?.vendorListVersion || undefined,
      tcfPolicyVersion: 5 // TCF 2.2 uses policy version 5
    };

    if (callback && typeof callback === 'function') {
      callback(pingData, true);
    }
  }

  /**
   * Map display status to spec-compliant values
   */
  private mapDisplayStatus(displayStatus: string): string {
    switch (displayStatus) {
      case 'visible':
        return 'visible';
      case 'hidden':
        return 'hidden';
      case 'disabled':
        return 'disabled';
      default:
        return 'hidden';
    }
  }

  /**
   * Handle addEventListener command
   */
  private handleAddEventListener(version: number, callback: Function, _parameter?: any): void {
    try {
      const listenerId = this.generateListenerId();
      
      // Store callback with listenerId for future removal
      if (!this.eventListeners.has('addEventListener')) {
        this.eventListeners.set('addEventListener', new Map());
      }
      
      const listenerMap = this.eventListeners.get('addEventListener')!;
      listenerMap.set(listenerId, callback);
      
      // Immediately call callback with current TC data and listenerId
      this.getTCDataForCallback(version, callback, listenerId);
      
    } catch (error) {
      console.error('Error in addEventListener:', error);
      callback(null, false);
    }
  }

  /**
   * Handle removeEventListener command
   */
  private handleRemoveEventListener(_version: number, callback: Function, parameter?: any): void {
    try {
      const listenerId = parameter;
      
      if (typeof listenerId !== 'number') {
        console.warn('removeEventListener requires a valid listenerId parameter');
        callback(false);
        return;
      }
      
      const listenerMap = this.eventListeners.get('addEventListener');
      const removed = listenerMap?.delete(listenerId) || false;
      
      callback(removed);
      
    } catch (error) {
      console.error('Error in removeEventListener:', error);
      callback(false);
    }
  }

  /**
   * Get TC data for callback with proper event status and listener ID
   */
  private async getTCDataForCallback(_version: number, callback: Function, listenerId?: number): Promise<void> {
    try {
      const tcData = await this.buildTCData();
      tcData.listenerId = listenerId;
      
      callback(tcData, true);
    } catch (error) {
      console.error('Error getting TC data for callback:', error);
      callback(null, false);
    }
  }

  /**
   * Normalize data
   */

  private normalizeToMidnightUTC(date = new Date()) {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
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
      // Ensure GVL is loaded before creating TCModel
      const gvl = await this.gvlManager.getGVL();
      
      // Create TCModel with GVL
      const tcModel = new TCModel(gvl);
      tcModel.created = this.normalizeToMidnightUTC();
      tcModel.lastUpdated = this.normalizeToMidnightUTC();
      tcModel.cmpId = this.config.cmpId;
      tcModel.cmpVersion = this.config.cmpVersion;
      tcModel.policyVersion = 4;
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
        tcfPolicyVersion: 4,
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
      this.state.tcfPolicyVersion = 4;
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
    return this.buildTCData();
  }

  /**
   * Build comprehensive TC data object
   */
  private async buildTCData(): Promise<any> {
    const tcData = {
      tcString: this.state.tcString || '',
      tcfPolicyVersion: this.state.tcfPolicyVersion || 5, // TCF 2.2 uses policy version 5
      cmpId: this.config.cmpId,
      cmpVersion: this.config.cmpVersion,
      cmpStatus: this.mapSignalStatusToCmpStatus(this.state.signalStatus),
      isServiceSpecific: !this.config.storeConsentGlobally,
      useNonStandardTexts: false,
      purposeOneTreatment: false,
      publisherCC: this.detectPublisherCountryCode(),
      eventStatus: this.mapEventStatus(this.state.eventStatus),
      gdprApplies: this.state.gdprApplies,
      purpose: {
        consents: {} as { [key: number]: boolean },
        legitimateInterests: {} as { [key: number]: boolean }
      },
      vendor: {
        consents: {} as { [key: number]: boolean },
        legitimateInterests: {} as { [key: number]: boolean },
        vendorsDisclosed: {} as { [key: number]: boolean }
      },
      specialFeatureOptins: {} as { [key: number]: boolean },
      publisher: {
        consents: {} as { [key: number]: boolean },
        legitimateInterests: {} as { [key: number]: boolean },
        customPurpose: {
          consents: {} as { [key: number]: boolean },
          legitimateInterests: {} as { [key: number]: boolean }
        },
        restrictions: {} as { [key: number]: { [key: number]: number } }
      }
    };

    // If we have a TC string, decode it to populate the data
    if (this.state.tcString) {
      try {
        const tcModel = TCString.decode(this.state.tcString);
        
        // Populate purpose consents and legitimate interests
        tcModel.purposeConsents.forEach((consent, purposeId) => {
          tcData.purpose.consents[purposeId] = consent;
        });
        
        tcModel.purposeLegitimateInterests.forEach((interest, purposeId) => {
          tcData.purpose.legitimateInterests[purposeId] = interest;
        });
        
        // Populate vendor consents and legitimate interests
        tcModel.vendorConsents.forEach((consent, vendorId) => {
          tcData.vendor.consents[vendorId] = consent;
        });
        
        tcModel.vendorLegitimateInterests.forEach((interest, vendorId) => {
          tcData.vendor.legitimateInterests[vendorId] = interest;
        });
        
        // Populate disclosed vendors (all vendors in the TC string are disclosed)
        tcModel.vendorConsents.forEach((_, vendorId) => {
          tcData.vendor.vendorsDisclosed[vendorId] = true;
        });
        
        tcModel.vendorLegitimateInterests.forEach((_, vendorId) => {
          tcData.vendor.vendorsDisclosed[vendorId] = true;
        });
        
        // Populate special feature opt-ins
        tcModel.specialFeatureOptins.forEach((optin, featureId) => {
          tcData.specialFeatureOptins[featureId] = optin;
        });
        
        // Populate publisher consents
        tcModel.publisherConsents.forEach((consent, purposeId) => {
          tcData.publisher.consents[purposeId] = consent;
        });
        
        tcModel.publisherLegitimateInterests.forEach((interest, purposeId) => {
          tcData.publisher.legitimateInterests[purposeId] = interest;
        });
        
        // Populate publisher custom purposes
        tcModel.publisherCustomConsents.forEach((consent, purposeId) => {
          tcData.publisher.customPurpose.consents[purposeId] = consent;
        });
        
        tcModel.publisherCustomLegitimateInterests.forEach((interest, purposeId) => {
          tcData.publisher.customPurpose.legitimateInterests[purposeId] = interest;
        });
        
        // Populate publisher restrictions
        const restrictions = tcModel.publisherRestrictions.getRestrictions();
        restrictions.forEach((restriction, purposeId) => {
          if (!tcData.publisher.restrictions[purposeId]) {
            tcData.publisher.restrictions[purposeId] = {};
          }
          // Handle publisher restrictions properly
          for (const [vendorId, restrictionType] of Object.entries(restriction)) {
            tcData.publisher.restrictions[purposeId][parseInt(vendorId)] = restrictionType as number;
          }
        });
        
      } catch (error) {
        console.error('Error decoding TC string:', error);
      }
    }

    return tcData;
  }

  /**
   * Convert boolean map to bitfield string for in-app format
   */
  private convertBooleanMapToBitfield(booleanMap: { [key: number]: boolean }): string {
    if (Object.keys(booleanMap).length === 0) {
      return '';
    }
    
    const maxId = Math.max(...Object.keys(booleanMap).map(Number));
    let bitfield = '';
    
    for (let i = 1; i <= maxId; i++) {
      bitfield += booleanMap[i] ? '1' : '0';
    }
    
    return bitfield;
  }

  /**
   * Convert restrictions to in-app format
   */
  private convertRestrictionsToInAppFormat(restrictions: { [purposeId: number]: { [vendorId: number]: number } }): { [purposeId: string]: string } {
    const result: { [purposeId: string]: string } = {};
    
    Object.entries(restrictions).forEach(([purposeId, vendorRestrictions]) => {
      const maxVendorId = Math.max(...Object.keys(vendorRestrictions).map(Number));
      let restrictionString = '';
      
      for (let i = 1; i <= maxVendorId; i++) {
        const restriction = vendorRestrictions[i];
        restrictionString += restriction !== undefined ? restriction.toString() : '_';
      }
      
      result[purposeId] = restrictionString;
    });
    
    return result;
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

  // Alternative simpler synchronous version if you prefer:
  /**
   * Use cookie to determine if GDPR applies
   */
  private determineGDPRApplies(): boolean {
    try {
      // check for cookie dcRgO if dcRgO = xTycQ95c19X02zs43 then GDPR applies
      const cookie = document.cookie;
      const dcRgO = cookie.split('; ').find(row => row.startsWith('dcRgO='));
      if (dcRgO) {
        const continentCode = dcRgO.split('=')[1];
        return continentCode === 'xTycQ95c19X02zs43'; // EU
      }
      return false;
    } catch {
      // Default to true for compliance safety
      return true;
    }
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
  private async notifyStateChange(): Promise<void> {
    const listenerMap = this.eventListeners.get('addEventListener');
    if (listenerMap) {
      for (const [listenerId, callback] of listenerMap) {
        try {
          await this.getTCDataForCallback(2, callback, listenerId);
        } catch (error) {
          console.error('Error notifying listener:', error);
        }
      }
    }
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