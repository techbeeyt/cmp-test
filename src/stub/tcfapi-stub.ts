/**
 * IAB TCF 2.2 Compliant CMP Stub API
 * This stub must be loaded synchronously before any other scripts that depend on __tcfapi
 */

interface QueuedCall {
  command: string;
  version: number;
  callback: Function;
  parameter?: any;
}

// PostMessage event interface removed - using built-in MessageEvent

interface PingReturn {
  gdprApplies?: boolean;
  cmpLoaded: boolean;
  cmpStatus: string;
  displayStatus?: string;
  apiVersion: string;
  cmpVersion?: number;
  cmpId?: number;
  gvlVersion?: number;
  tcfPolicyVersion?: number;
}

declare global {
  interface Window {
    __tcfapi: Function;
    __tcfapiBuffer?: QueuedCall[];
    __tcfapiReady?: boolean;
  }
}

/**
 * TCF API Stub Implementation
 * This provides the basic functionality required before the full CMP loads
 */
export class TCFAPIStub {
  private static instance: TCFAPIStub;
  private callQueue: QueuedCall[] = [];
  private isReady = false;
  private locatorFrame: HTMLIFrameElement | null = null;

  constructor() {
    if (TCFAPIStub.instance) {
      return TCFAPIStub.instance;
    }

    TCFAPIStub.instance = this;
    this.initialize();
  }

  private initialize(): void {
    // Check if CMP is already present
    if (!this.checkForExistingCMP()) {
      // Create locator frame to signal CMP presence
      this.createLocatorFrame();
      
      // Set up __tcfapi function
      this.setupTCFAPI();
      
      // Set up postMessage handler for iframe communication
      this.setupPostMessageHandler();
      
      console.log('TCF API Stub initialized');
    }
  }

  private checkForExistingCMP(): boolean {
    try {
      // Check if another CMP is already present
      if (window.frames && (window.frames as any)['__tcfapiLocator']) {
        console.log('CMP already present, not initializing stub');
        return true;
      }
    } catch (error) {
      // Ignore errors when checking frames
    }
    return false;
  }

  private createLocatorFrame(): void {
    try {
      this.locatorFrame = document.createElement('iframe');
      this.locatorFrame.name = '__tcfapiLocator';
      this.locatorFrame.style.cssText = 'display:none';
      this.locatorFrame.setAttribute('aria-hidden', 'true');
      this.locatorFrame.setAttribute('tabindex', '-1');
      
      // Add to DOM
      if (document.body) {
        document.body.appendChild(this.locatorFrame);
      } else if (document.documentElement) {
        document.documentElement.appendChild(this.locatorFrame);
      }
    } catch (error) {
      console.warn('Failed to create TCF locator frame:', error);
    }
  }

  private setupTCFAPI(): void {
    const self = this;
    
    window.__tcfapi = function(
      command: string,
      version: number,
      callback: Function,
      parameter?: any
    ): void {
      if (!callback || typeof callback !== 'function') {
        console.warn('TCF API: Invalid callback provided');
        return;
      }

      // Handle ping command immediately in stub
      if (command === 'ping') {
        const pingResponse: PingReturn = {
          gdprApplies: undefined, // Will be determined by full CMP
          cmpLoaded: self.isReady,
          cmpStatus: self.isReady ? 'loaded' : 'stub',
          displayStatus: 'hidden',
          apiVersion: '2.2',
          cmpVersion: undefined,
          cmpId: undefined,
          gvlVersion: undefined,
          tcfPolicyVersion: undefined
        };
        
        try {
          callback(pingResponse, true);
        } catch (error) {
          console.error('Error in ping callback:', error);
        }
        return;
      }

      // Queue other commands for when full CMP loads
      if (!self.isReady) {
        self.callQueue.push({
          command,
          version,
          callback,
          parameter
        });
        return;
      }

      // If CMP is ready, this should not happen as __tcfapi would be replaced
      console.warn('CMP is ready but __tcfapi stub is still being called');
      callback(null, false);
    };

    // Store reference to queue for full CMP
    window.__tcfapiBuffer = this.callQueue;
  }

  private setupPostMessageHandler(): void {

    window.addEventListener('message', function(event: MessageEvent) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (!data.__tcfapiCall) {
          return;
        }

        const { command, version, parameter, callId } = data.__tcfapiCall;

        // Create callback that sends response via postMessage
        const callback = function(returnValue: any, success: boolean) {
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
        if (window.__tcfapi) {
          window.__tcfapi(command, version, callback, parameter);
        }
      } catch (error) {
        console.error('Error handling postMessage:', error);
      }
    }, false);
  }

  /**
   * Called by the full CMP when it loads to process queued calls
   */
  public processQueue(fullAPI: Function): void {
    this.isReady = true;
    
    // Process all queued calls
    while (this.callQueue.length > 0) {
      const call = this.callQueue.shift();
      if (call) {
        try {
          fullAPI(call.command, call.version, call.callback, call.parameter);
        } catch (error) {
          console.error('Error processing queued call:', error);
          if (call.callback) {
            call.callback(null, false);
          }
        }
      }
    }

    // Clear the buffer
    window.__tcfapiBuffer = [];
    window.__tcfapiReady = true;
    
    console.log('TCF API Stub: Processed queued calls and handed over to full CMP');
  }

  /**
   * Get the current call queue (for testing/debugging)
   */
  public getQueue(): QueuedCall[] {
    return [...this.callQueue];
  }

  /**
   * Check if stub is ready
   */
  public isStubReady(): boolean {
    return this.isReady;
  }
}

// Auto-initialize if we're in a browser environment
if (typeof window !== 'undefined' && !window.__tcfapi) {
  new TCFAPIStub();
}

export default TCFAPIStub;