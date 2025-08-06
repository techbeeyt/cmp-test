/**
 * IAB TCF 2.2 Compliant CMP Stub API
 * 
 * This script MUST be loaded synchronously in the <head> section
 * before any other scripts that depend on __tcfapi
 * 
 * Based on IAB TCF 2.2 specification requirements
 */

(function() {
  'use strict';

  // Avoid double initialization
  if (window.__tcfapi) {
    return;
  }

  var callQueue = [];
  var locatorFrame = null;
  var cmpLoaded = false;

  /**
   * Check if another CMP is already present
   */
  function checkForExistingCMP() {
    try {
      if (window.frames && window.frames['__tcfapiLocator']) {
        console.log('CMP already present via __tcfapiLocator frame');
        return true;
      }
    } catch (error) {
      // Ignore frame access errors
    }
    return false;
  }

  /**
   * Create the __tcfapiLocator iframe to signal CMP presence
   */
  function createLocatorFrame() {
    try {
      locatorFrame = document.createElement('iframe');
      locatorFrame.name = '__tcfapiLocator';
      locatorFrame.style.cssText = 'display:none;position:absolute;width:0;height:0;border:none;';
      locatorFrame.setAttribute('aria-hidden', 'true');
      locatorFrame.setAttribute('tabindex', '-1');
      
      // Add to DOM immediately if possible, otherwise wait for DOM ready
      function addToDom() {
        if (document.body) {
          document.body.appendChild(locatorFrame);
        } else if (document.documentElement) {
          document.documentElement.appendChild(locatorFrame);
        } else if (document.head) {
          document.head.appendChild(locatorFrame);
        }
      }

      if (document.readyState === 'loading') {
        if (document.addEventListener) {
          document.addEventListener('DOMContentLoaded', addToDom);
        } else {
          // Fallback for older browsers
          setTimeout(addToDom, 0);
        }
      } else {
        addToDom();
      }
      
    } catch (error) {
      console.warn('Failed to create __tcfapiLocator frame:', error);
    }
  }

  /**
   * TCF API Stub Implementation
   */
  function tcfapiStub(command, version, callback, parameter) {
    // Validate callback
    if (!callback || typeof callback !== 'function') {
      console.warn('TCF API Stub: Invalid callback provided for command:', command);
      return;
    }

    // Handle ping command immediately in stub
    if (command === 'ping') {
      var pingResponse = {
        gdprApplies: undefined, // Will be determined by full CMP
        cmpLoaded: cmpLoaded,
        cmpStatus: cmpLoaded ? 'loaded' : 'stub',
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
    if (!cmpLoaded) {
      callQueue.push({
        command: command,
        version: version,
        callback: callback,
        parameter: parameter
      });
      return;
    }

    // If CMP is loaded, this should not happen as __tcfapi would be replaced
    console.warn('CMP is loaded but stub is still being called');
    callback(null, false);
  }

  /**
   * PostMessage handler for iframe communication
   */
  function postMessageHandler(event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (!data || !data.__tcfapiCall) {
        return;
      }

      var call = data.__tcfapiCall;
      var callId = call.callId;
      var command = call.command;
      var version = call.version;
      var parameter = call.parameter;

      // Create callback that sends response via postMessage
      var callback = function(returnValue, success) {
        var responseData = {
          __tcfapiReturn: {
            returnValue: returnValue,
            success: success,
            callId: callId
          }
        };

        try {
          if (event.source && event.source.postMessage) {
            event.source.postMessage(responseData, event.origin);
          }
        } catch (error) {
          console.error('Failed to send postMessage response:', error);
        }
      };

      // Call __tcfapi with the postMessage callback
      if (window.__tcfapi) {
        window.__tcfapi(command, version, callback, parameter);
      } else {
        callback(null, false);
      }
      
    } catch (error) {
      console.error('Error handling postMessage in stub:', error);
    }
  }

  /**
   * Initialize the stub
   */
  function initializeStub() {
    // Check if another CMP is already present
    if (checkForExistingCMP()) {
      return;
    }

    // Create the locator frame
    createLocatorFrame();
    
    // Set up the __tcfapi function
    window.__tcfapi = tcfapiStub;
    
    // Store reference to queue for full CMP
    window.__tcfapiBuffer = callQueue;
    
    // Set up postMessage handler
    if (window.addEventListener) {
      window.addEventListener('message', postMessageHandler, false);
    } else if (window.attachEvent) {
      // Fallback for older browsers
      window.attachEvent('onmessage', postMessageHandler);
    }
    
    console.log('TCF API Stub initialized');
  }

  /**
   * Method called by full CMP to process queued calls
   */
  window.__tcfapiStubReady = function(fullAPI) {
    cmpLoaded = true;
    
    // Process all queued calls
    while (callQueue.length > 0) {
      var call = callQueue.shift();
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
    console.log('TCF API Stub: Processed queued calls and handed over to full CMP');
  };

  // Initialize immediately
  initializeStub();

})();