import { CMPCore } from '@/core/CMPCore';
import { UIOptions } from '@/types';

export class ConsentUI {
  private cmpCore: CMPCore;
  private uiOptions: UIOptions;
  private container: HTMLElement | null = null;
  // private _currentView: 'banner' | 'purposes' | 'vendors' = 'banner'; // Reserved for future use
  private purposeConsents: { [key: number]: boolean } = {};
  private vendorConsents: { [key: number]: boolean } = {};
  private specialFeatureOptins: { [key: number]: boolean } = {};

  constructor(cmpCore: CMPCore, uiOptions: UIOptions = {}) {
    this.cmpCore = cmpCore;
    this.uiOptions = {
      theme: 'light',
      position: 'bottom',
      primaryColor: '#1f56e3',
      showVendorCount: true,
      showPurposeDescriptions: true,
      ...uiOptions
    };
  }

  /**
   * Show the consent UI
   */
  public show(): void {
    if (this.container) {
      this.container.style.display = 'block';
      return;
    }

    this.createUI();
    this.loadCurrentConsents();
  }

  /**
   * Hide the consent UI
   */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Remove the consent UI from DOM
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * Create the main UI container
   */
  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'tcf-cmp-container';
    this.container.className = `tcf-cmp ${this.uiOptions.theme} ${this.uiOptions.position}`;
    
    // Add CSS styles
    this.injectStyles();
    document.body.appendChild(this.container);
    
    // Render initial view
    this.renderBannerView();
    
  }

  /**
   * Render the main banner view
   */
  private renderBannerView(): void {
    if (!this.container) return;

    // this._currentView = 'banner'; // Reserved for future use
    this.container.innerHTML = `
      <div class="tcf-cmp-banner">
        <div class="tcf-cmp-content">
          <div class="tcf-cmp-text">
            <h2>Your Privacy Choices</h2>
            <p>We and our partners use cookies and similar technologies to provide, protect and improve our products and services, personalize content and ads, and analyze our traffic. By clicking "Accept All", you consent to our use of these technologies.</p>
          </div>
          <div class="tcf-cmp-actions">
            <button class="tcf-btn tcf-btn-secondary" id="tcf-reject-all">Reject All</button>
            <button class="tcf-btn tcf-btn-outline" id="tcf-customize">Customize</button>
            <button class="tcf-btn tcf-btn-primary" id="tcf-accept-all">Accept All</button>
          </div>
        </div>
        <button class="tcf-close" id="tcf-close" aria-label="Close">&times;</button>
      </div>
    `;

    this.attachBannerEventListeners();
  }

  /**
   * Render the purposes customization view
   */
  private async renderPurposesView(): Promise<void> {
    if (!this.container) return;

    // this._currentView = 'purposes'; // Reserved for future use
    const gvlManager = this.cmpCore.getGVLManager();
    const purposes = await gvlManager.getPurposes();
    const specialFeatures = await gvlManager.getSpecialFeatures();

    let purposesHtml = '';
    Object.entries(purposes).forEach(([id, purpose]) => {
      const checked = this.purposeConsents[parseInt(id)] ? 'checked' : '';
      purposesHtml += `
        <div class="tcf-purpose-item">
          <div class="tcf-purpose-header">
            <label class="tcf-toggle">
              <input type="checkbox" ${checked} data-purpose-id="${id}" class="tcf-purpose-toggle">
              <span class="tcf-toggle-slider"></span>
            </label>
            <div class="tcf-purpose-info">
              <h4>${purpose.name}</h4>
              ${this.uiOptions.showPurposeDescriptions ? `<p>${purpose.description}</p>` : ''}
              <div class="tcf-purpose-details">
                <span class="tcf-purpose-id">Purpose ID: ${id}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    let specialFeaturesHtml = '';
    if (Object.keys(specialFeatures).length > 0) {
      Object.entries(specialFeatures).forEach(([id, feature]) => {
        const checked = this.specialFeatureOptins[parseInt(id)] ? 'checked' : '';
        specialFeaturesHtml += `
          <div class="tcf-purpose-item">
            <div class="tcf-purpose-header">
              <label class="tcf-toggle">
                <input type="checkbox" ${checked} data-special-feature-id="${id}" class="tcf-special-feature-toggle">
                <span class="tcf-toggle-slider"></span>
              </label>
              <div class="tcf-purpose-info">
                <h4>${feature.name}</h4>
                <p>${feature.description}</p>
              </div>
            </div>
          </div>
        `;
      });
    }

    this.container.innerHTML = `
      <div class="tcf-cmp-modal">
        <div class="tcf-cmp-header">
          <button class="tcf-back-btn" id="tcf-back">&larr; Back</button>
          <h2>Privacy Preferences</h2>
          <button class="tcf-close" id="tcf-close">&times;</button>
        </div>
        <div class="tcf-cmp-body">
          <div class="tcf-tabs">
            <button class="tcf-tab active" id="tab-purposes">Purposes</button>
            <button class="tcf-tab" id="tab-vendors">Partners</button>
          </div>
          <div class="tcf-tab-content">
            <div class="tcf-purposes-list">
              <div class="tcf-purposes-header">
                <p>Select which purposes you consent to. Each purpose describes how your data may be used.</p>
              </div>
              ${purposesHtml}
              ${specialFeaturesHtml ? `<h3>Special Features</h3>${specialFeaturesHtml}` : ''}
            </div>
          </div>
        </div>
        <div class="tcf-cmp-footer">
          <button class="tcf-btn tcf-btn-secondary" id="tcf-reject-all-modal">Reject All</button>
          <button class="tcf-btn tcf-btn-primary" id="tcf-save-preferences">Save Preferences</button>
        </div>
      </div>
    `;

    this.attachPurposesEventListeners();
  }

  /**
   * Render the vendors view
   */
  private async renderVendorsView(): Promise<void> {
    if (!this.container) return;

    try {
      const gvlManager = this.cmpCore.getGVLManager();
      const vendors = await gvlManager.getVendors();
      const purposes = await gvlManager.getPurposes();
      const specialFeatures = await gvlManager.getSpecialFeatures();

      console.log('Rendering vendors view with vendors:', Object.keys(vendors).length);

      let vendorsHtml = '';
      if (Object.keys(vendors).length === 0) {
        vendorsHtml = '<p>No vendor data available. Please try refreshing the page.</p>';
      } else {
        Object.entries(vendors).forEach(([id, vendor]) => {
          const checked = this.vendorConsents[parseInt(id)] ? 'checked' : '';
          
          // Get vendor purposes
          const vendorPurposes = vendor.purposes || [];
          const vendorLegitimateInterests = vendor.legIntPurposes || [];
          const vendorSpecialFeatures = vendor.specialFeatures || [];
          
          // Create purpose lists
          const purposesList = vendorPurposes.map(pId => purposes[pId]?.name || `Purpose ${pId}`).join(', ');
          const legitimateInterestsList = vendorLegitimateInterests.map(pId => purposes[pId]?.name || `Purpose ${pId}`).join(', ');
          const specialFeaturesList = vendorSpecialFeatures.map(fId => specialFeatures[fId]?.name || `Feature ${fId}`).join(', ');
          
          vendorsHtml += `
            <div class="tcf-vendor-item">
              <div class="tcf-vendor-header">
                <label class="tcf-toggle">
                  <input type="checkbox" ${checked} data-vendor-id="${id}" class="tcf-vendor-toggle">
                  <span class="tcf-toggle-slider"></span>
                </label>
                <div class="tcf-vendor-info">
                  <h4>${vendor.name || `Vendor ${id}`}</h4>
                  <div class="tcf-vendor-details">
                    ${vendorPurposes.length > 0 ? `
                      <div class="tcf-vendor-purpose">
                        <strong>Purposes:</strong> ${purposesList}
                      </div>
                    ` : ''}
                    ${vendorLegitimateInterests.length > 0 ? `
                      <div class="tcf-vendor-legitimate-interest">
                        <strong>Legitimate Interests:</strong> ${legitimateInterestsList}
                      </div>
                    ` : ''}
                    ${vendorSpecialFeatures.length > 0 ? `
                      <div class="tcf-vendor-special-features">
                        <strong>Special Features:</strong> ${specialFeaturesList}
                      </div>
                    ` : ''}
                    <div class="tcf-vendor-links">
                      <a href="${vendor.policyUrl || '#'}" target="_blank" rel="noopener">Privacy Policy</a>
                      ${vendor.cookieMaxAgeSeconds ? `<span class="tcf-cookie-duration">Cookie Duration: ${Math.round(vendor.cookieMaxAgeSeconds / 86400)} days</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
      }

      // Render the complete modal structure for vendors view
      this.container.innerHTML = `
        <div class="tcf-cmp-modal">
          <div class="tcf-cmp-header">
            <button class="tcf-back-btn" id="tcf-back">&larr; Back</button>
            <h2>Privacy Preferences</h2>
            <button class="tcf-close" id="tcf-close">&times;</button>
          </div>
          <div class="tcf-cmp-body">
            <div class="tcf-tabs">
              <button class="tcf-tab" id="tab-purposes">Purposes</button>
              <button class="tcf-tab active" id="tab-vendors">Partners</button>
            </div>
            <div class="tcf-tab-content">
              <div class="tcf-vendors-list">
                <div class="tcf-vendors-header">
                  <p>Select which partners can process your data. Each partner uses data for specific purposes as listed below.</p>
                </div>
                ${vendorsHtml}
              </div>
            </div>
          </div>
          <div class="tcf-cmp-footer">
            <button class="tcf-btn tcf-btn-secondary" id="tcf-reject-all-modal">Reject All</button>
            <button class="tcf-btn tcf-btn-primary" id="tcf-save-preferences">Save Preferences</button>
          </div>
        </div>
      `;

      this.attachVendorsEventListeners();
    } catch (error) {
      console.error('Error rendering vendors view:', error);
      
      // Fallback: render a simple error message
      this.container.innerHTML = `
        <div class="tcf-cmp-modal">
          <div class="tcf-cmp-header">
            <button class="tcf-back-btn" id="tcf-back">&larr; Back</button>
            <h2>Privacy Preferences</h2>
            <button class="tcf-close" id="tcf-close">&times;</button>
          </div>
          <div class="tcf-cmp-body">
            <div class="tcf-tabs">
              <button class="tcf-tab" id="tab-purposes">Purposes</button>
              <button class="tcf-tab active" id="tab-vendors">Partners</button>
            </div>
            <div class="tcf-tab-content">
              <div class="tcf-vendors-list">
                <p>Unable to load vendor data. Please try again later.</p>
              </div>
            </div>
          </div>
          <div class="tcf-cmp-footer">
            <button class="tcf-btn tcf-btn-secondary" id="tcf-reject-all-modal">Reject All</button>
            <button class="tcf-btn tcf-btn-primary" id="tcf-save-preferences">Save Preferences</button>
          </div>
        </div>
      `;
      
      this.attachVendorsEventListeners();
    }
  }

  /**
   * Attach event listeners for banner view
   */
  private attachBannerEventListeners(): void {
    console.log('event listeners added');
    const acceptAllBtn = document.getElementById('tcf-accept-all');
    const rejectAllBtn = document.getElementById('tcf-reject-all');
    const customizeBtn = document.getElementById('tcf-customize');
    const closeBtn = document.getElementById('tcf-close');

    acceptAllBtn?.addEventListener('click', () => this.handleAcceptAll());
    rejectAllBtn?.addEventListener('click', () => this.handleRejectAll());
    customizeBtn?.addEventListener('click', () => {
      console.log('customize button clicked!');
      this.renderPurposesView()
    });
    closeBtn?.addEventListener('click', () => this.hide());
  }

  /**
   * Attach event listeners for purposes view
   */
  private attachPurposesEventListeners(): void {
    const backBtn = document.getElementById('tcf-back');
    const closeBtn = document.getElementById('tcf-close');
    const saveBtn = document.getElementById('tcf-save-preferences');
    const rejectAllBtn = document.getElementById('tcf-reject-all-modal');
    const purposesTab = document.getElementById('tab-purposes');
    const vendorsTab = document.getElementById('tab-vendors');

    backBtn?.addEventListener('click', () => this.renderBannerView());
    closeBtn?.addEventListener('click', () => this.hide());
    saveBtn?.addEventListener('click', () => this.handleSavePreferences());
    rejectAllBtn?.addEventListener('click', () => this.handleRejectAll());
    purposesTab?.addEventListener('click', () => this.renderPurposesView());
    vendorsTab?.addEventListener('click', () => this.renderVendorsView());

    // Purpose toggles
    const purposeToggles = document.querySelectorAll('.tcf-purpose-toggle');
    purposeToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const purposeId = parseInt(target.dataset.purposeId || '0');
        this.purposeConsents[purposeId] = target.checked;
      });
    });

    // Special feature toggles
    const specialFeatureToggles = document.querySelectorAll('.tcf-special-feature-toggle');
    specialFeatureToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const featureId = parseInt(target.dataset.specialFeatureId || '0');
        this.specialFeatureOptins[featureId] = target.checked;
      });
    });
  }

  /**
   * Attach event listeners for vendors view
   */
  private attachVendorsEventListeners(): void {
    const backBtn = document.getElementById('tcf-back');
    const closeBtn = document.getElementById('tcf-close');
    const saveBtn = document.getElementById('tcf-save-preferences');
    const rejectAllBtn = document.getElementById('tcf-reject-all-modal');
    const purposesTab = document.getElementById('tab-purposes');
    const vendorsTab = document.getElementById('tab-vendors');

    backBtn?.addEventListener('click', () => this.renderBannerView());
    closeBtn?.addEventListener('click', () => this.hide());
    saveBtn?.addEventListener('click', () => this.handleSavePreferences());
    rejectAllBtn?.addEventListener('click', () => this.handleRejectAll());
    purposesTab?.addEventListener('click', () => this.renderPurposesView());
    vendorsTab?.addEventListener('click', () => this.renderVendorsView());

    // Vendor toggles
    const vendorToggles = document.querySelectorAll('.tcf-vendor-toggle');
    vendorToggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const vendorId = parseInt(target.dataset.vendorId || '0');
        this.vendorConsents[vendorId] = target.checked;
      });
    });
  }

  /**
   * Handle accept all button click
   */
  private async handleAcceptAll(): Promise<void> {
    try {
      console.log('Accept All button clicked');
      
      const gvlManager = this.cmpCore.getGVLManager();
      
      // Get data with fallbacks in case GVL isn't loaded
      let purposes, vendors, specialFeatures;
      try {
        purposes = await gvlManager.getPurposes();
        vendors = await gvlManager.getVendors();
        specialFeatures = await gvlManager.getSpecialFeatures();
      } catch (gvlError) {
        console.warn('GVL not available, using default consent values:', gvlError);
        // Use default TCF 2.2 purposes (1-10) and common vendor IDs
        purposes = Array.from({length: 10}, (_, i) => i + 1).reduce((acc, id) => {
          acc[id] = { id, name: `Purpose ${id}` };
          return acc;
        }, {} as any);
        vendors = {};
        specialFeatures = {};
      }

      // Set all purposes to true
      const purposeConsents: { [key: number]: boolean } = {};
      Object.keys(purposes).forEach(id => {
        purposeConsents[parseInt(id)] = true;
      });

      // Set all vendors to true
      const vendorConsents: { [key: number]: boolean } = {};
      Object.keys(vendors).forEach(id => {
        vendorConsents[parseInt(id)] = true;
      });

      // Set all special features to true
      const specialFeatureOptins: { [key: number]: boolean } = {};
      Object.keys(specialFeatures).forEach(id => {
        specialFeatureOptins[parseInt(id)] = true;
      });

      console.log('Saving consent with Accept All:', {
        purposes: Object.keys(purposeConsents).length,
        vendors: Object.keys(vendorConsents).length,
        specialFeatures: Object.keys(specialFeatureOptins).length
      });

      await this.cmpCore.saveConsent(purposeConsents, vendorConsents, specialFeatureOptins);
      this.hide();
      
      console.log('Accept All consent saved successfully');
    } catch (error) {
      console.error('Failed to save accept all consent:', error);
      alert('Failed to save consent preferences. Please try again.');
    }
  }

  /**
   * Handle reject all button click
   */
  private async handleRejectAll(): Promise<void> {
    try {
      console.log('Reject All button clicked');
      
      const gvlManager = this.cmpCore.getGVLManager();
      
      // Get data with fallbacks in case GVL isn't loaded
      let purposes, vendors;
      try {
        purposes = await gvlManager.getPurposes();
        vendors = await gvlManager.getVendors();
      } catch (gvlError) {
        console.warn('GVL not available, using default reject values:', gvlError);
        // Use default TCF 2.2 purposes (1-10)
        purposes = Array.from({length: 10}, (_, i) => i + 1).reduce((acc, id) => {
          acc[id] = { id, name: `Purpose ${id}` };
          return acc;
        }, {} as any);
        vendors = {};
      }

      // Set all purposes to false
      const purposeConsents: { [key: number]: boolean } = {};
      Object.keys(purposes).forEach(id => {
        purposeConsents[parseInt(id)] = false;
      });

      // Set all vendors to false
      const vendorConsents: { [key: number]: boolean } = {};
      Object.keys(vendors).forEach(id => {
        vendorConsents[parseInt(id)] = false;
      });

      console.log('Saving consent with Reject All:', {
        purposes: Object.keys(purposeConsents).length,
        vendors: Object.keys(vendorConsents).length
      });

      await this.cmpCore.saveConsent(purposeConsents, vendorConsents, {});
      this.hide();
      
      console.log('Reject All consent saved successfully');
    } catch (error) {
      console.error('Failed to save reject all consent:', error);
      alert('Failed to save consent preferences. Please try again.');
    }
  }

  /**
   * Handle save preferences button click
   */
  private async handleSavePreferences(): Promise<void> {
    try {
      console.log('Save Preferences button clicked');
      console.log('Custom consent preferences:', {
        purposes: Object.keys(this.purposeConsents).filter(k => this.purposeConsents[parseInt(k)]).length,
        vendors: Object.keys(this.vendorConsents).filter(k => this.vendorConsents[parseInt(k)]).length,
        specialFeatures: Object.keys(this.specialFeatureOptins).filter(k => this.specialFeatureOptins[parseInt(k)]).length
      });

      await this.cmpCore.saveConsent(
        this.purposeConsents,
        this.vendorConsents,
        this.specialFeatureOptins
      );
      this.hide();
      
      console.log('Custom consent preferences saved successfully');
    } catch (error) {
      console.error('Failed to save custom consent:', error);
      alert('Failed to save your custom preferences. Please try again.');
    }
  }

  /**
   * Load current consent settings
   */
  private async loadCurrentConsents(): Promise<void> {
    // Initialize with default values
    const gvlManager = this.cmpCore.getGVLManager();
    
    try {
      const purposes = await gvlManager.getPurposes();
      const vendors = await gvlManager.getVendors();
      const specialFeatures = await gvlManager.getSpecialFeatures();

      // Initialize all as false
      Object.keys(purposes).forEach(id => {
        this.purposeConsents[parseInt(id)] = false;
      });

      Object.keys(vendors).forEach(id => {
        this.vendorConsents[parseInt(id)] = false;
      });

      Object.keys(specialFeatures).forEach(id => {
        this.specialFeatureOptins[parseInt(id)] = false;
      });

      console.log('Loaded consent data:', {
        purposes: Object.keys(purposes).length,
        vendors: Object.keys(vendors).length,
        specialFeatures: Object.keys(specialFeatures).length
      });

    } catch (error) {
      console.warn('Failed to load GVL data, using default consents:', error);
      
      // Fallback to basic TCF 2.2 purposes if GVL fails
      for (let i = 1; i <= 10; i++) {
        this.purposeConsents[i] = false;
      }
      
      // Initialize empty vendors and special features
      this.vendorConsents = {};
      this.specialFeatureOptins = {};
      
      console.log('Using fallback consent structure with 10 standard purposes');
    }
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (document.getElementById('tcf-cmp-styles')) return;

    const style = document.createElement('style');
    style.id = 'tcf-cmp-styles';
    style.textContent = `
      .tcf-cmp {
        position: fixed;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .tcf-cmp.bottom {
        bottom: 0;
        left: 0;
        right: 0;
      }

      .tcf-cmp.top {
        top: 0;
        left: 0;
        right: 0;
      }

      .tcf-cmp.center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 600px;
        max-height: 80vh;
      }

      .tcf-cmp-banner {
        background: white;
        border-top: 3px solid ${this.uiOptions.primaryColor};
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        position: relative;
      }

      .tcf-cmp-content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .tcf-cmp-text h2 {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .tcf-cmp-text p {
        margin: 0 0 20px 0;
        color: #666;
      }

      .tcf-cmp-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .tcf-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tcf-btn-primary {
        background: ${this.uiOptions.primaryColor};
        color: white;
      }

      .tcf-btn-primary:hover {
        opacity: 0.9;
      }

      .tcf-btn-secondary {
        background: #f5f5f5;
        color: #333;
      }

      .tcf-btn-outline {
        background: transparent;
        color: ${this.uiOptions.primaryColor};
        border: 1px solid ${this.uiOptions.primaryColor};
      }

      .tcf-close {
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
      }

      .tcf-cmp-modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-width: 800px;
        max-height: 80vh;
        margin: 20px;
        display: flex;
        flex-direction: column;
      }

      .tcf-cmp-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .tcf-back-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: ${this.uiOptions.primaryColor};
      }

      .tcf-cmp-header h2 {
        margin: 0;
        flex: 1;
        font-size: 18px;
      }

      .tcf-cmp-body {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .tcf-tabs {
        display: flex;
        border-bottom: 1px solid #eee;
      }

      .tcf-tab {
        padding: 15px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        color: #666;
        border-bottom: 2px solid transparent;
      }

      .tcf-tab.active {
        color: ${this.uiOptions.primaryColor};
        border-bottom-color: ${this.uiOptions.primaryColor};
      }

      .tcf-tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .tcf-purpose-item, .tcf-vendor-item {
        padding: 15px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .tcf-vendors-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .tcf-purpose-header, .tcf-vendor-header {
        display: flex;
        align-items: flex-start;
        gap: 15px;
      }

      .tcf-purpose-info h4, .tcf-vendor-info h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .tcf-purpose-info p, .tcf-vendor-info p {
        margin: 0;
        color: #666;
        font-size: 13px;
      }

      .tcf-purpose-details {
        margin-top: 8px;
        font-size: 12px;
        color: #999;
      }

      .tcf-purpose-id {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }

      .tcf-toggle {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }

      .tcf-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .tcf-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
      }

      .tcf-toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      .tcf-toggle input:checked + .tcf-toggle-slider {
        background-color: ${this.uiOptions.primaryColor};
      }

      .tcf-toggle input:checked + .tcf-toggle-slider:before {
        transform: translateX(20px);
      }

      .tcf-cmp-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .tcf-vendors-header, .tcf-purposes-header {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid ${this.uiOptions.primaryColor};
      }

      .tcf-vendors-header p, .tcf-purposes-header p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      .tcf-vendor-details {
        margin-top: 10px;
        font-size: 13px;
        color: #666;
      }

      .tcf-vendor-purpose, .tcf-vendor-legitimate-interest, .tcf-vendor-special-features {
        margin-bottom: 5px;
        line-height: 1.4;
      }

      .tcf-vendor-purpose strong {
        color: #2c5aa0;
      }

      .tcf-vendor-legitimate-interest strong {
        color: #d63384;
      }

      .tcf-vendor-special-features strong {
        color: #fd7e14;
      }

      .tcf-vendor-links {
        margin-top: 10px;
        font-size: 12px;
        color: #999;
      }

      .tcf-vendor-links a {
        color: ${this.uiOptions.primaryColor};
        text-decoration: none;
        margin-right: 15px;
      }

      .tcf-vendor-links a:hover {
        text-decoration: underline;
      }

      .tcf-cookie-duration {
        margin-left: 10px;
        font-size: 12px;
        color: #999;
      }

      @media (max-width: 768px) {
        .tcf-cmp-content {
          padding: 15px;
        }

        .tcf-cmp-actions {
          flex-direction: column;
        }

        .tcf-cmp-modal {
          margin: 10px;
          max-height: 90vh;
        }

        .tcf-cmp-header {
          padding: 15px;
        }

        .tcf-tab-content {
          padding: 15px;
        }

        .tcf-cmp-footer {
          padding: 15px;
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }
}