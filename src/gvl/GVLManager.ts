import { GVL } from '@iabtcf/core';

export class GVLManager {
  // private static readonly DEFAULT_GVL_URL = 'https://vendor-list.consensu.org/v3/vendor-list.json';
  private static readonly DEFAULT_GVL_URL = 'https://cdn.trydatacops.com/v3/vendor-list.json';
  private static readonly GVL_CACHE_KEY = 'tcf_gvl_cache';
  private static readonly CACHE_DURATION = 86400000; // 24 hours in milliseconds

  private gvl: GVL | null = null;
  private gvlUrl: string;
  private loading = false;
  private loadPromise: Promise<GVL> | null = null;

  constructor(gvlUrl?: string) {
    this.gvlUrl = gvlUrl || GVLManager.DEFAULT_GVL_URL;
  }

  /**
   * Get the Global Vendor List, loading it if necessary
   */
  public async getGVL(version?: number | string): Promise<GVL> {
    // If a specific version is requested
    if (version && version !== 'LATEST') {
      return this.getSpecificGVLVersion(version);
    }

    // Return cached GVL if available
    if (this.gvl) {
      return this.gvl;
    }

    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this.loadGVL();
    
    try {
      this.gvl = await this.loadPromise;
      return this.gvl;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Get a specific version of the GVL
   */
  private async getSpecificGVLVersion(version: number | string): Promise<GVL> {
    const versionNumber = typeof version === 'string' ? parseInt(version) : version;
    
    if (isNaN(versionNumber) || versionNumber < 1) {
      throw new Error('Invalid GVL version requested');
    }

    // Check if we already have this version cached
    const cacheKey = `${GVLManager.GVL_CACHE_KEY}_v${versionNumber}`;
    const cached = this.getCachedGVL(cacheKey);
    if (cached) {
      return new GVL(cached.data);
    }

    // Construct URL for specific version
    const versionUrl = this.gvlUrl.replace(/\/vendor-list\.json$/, `/archives/vendor-list-v${versionNumber}.json`);
    
    try {
      const response = await fetch(versionUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch GVL version ${versionNumber}: ${response.statusText}`);
      }
      
      const gvlData = await response.json();
      
      // Cache the version-specific GVL
      this.cacheGVL(gvlData, cacheKey);
      
      return new GVL(gvlData);
      
    } catch (error) {
      console.error(`Error loading GVL version ${versionNumber}:`, error);
      // Fallback to latest version
      return this.getGVL();
    }
  }

  /**
   * Force reload the GVL from the server
   */
  public async reloadGVL(): Promise<GVL> {
    this.clearCache();
    this.gvl = null;
    return this.getGVL();
  }

  /**
   * Get vendor information by ID
   */
  public async getVendor(vendorId: number) {
    const gvl = await this.getGVL();
    return gvl.vendors[vendorId] || null;
  }

  /**
   * Get all vendors
   */
  public async getVendors() {
    const gvl = await this.getGVL();
    return gvl.vendors;
  }

  /**
   * Get purposes
   */
  public async getPurposes() {
    const gvl = await this.getGVL();
    return gvl.purposes;
  }

  /**
   * Get special features
   */
  public async getSpecialFeatures() {
    const gvl = await this.getGVL();
    return gvl.specialFeatures;
  }

  /**
   * Get special purposes
   */
  public async getSpecialPurposes() {
    const gvl = await this.getGVL();
    return gvl.specialPurposes;
  }

  /**
   * Load GVL from cache or fetch from server
   */
  private async loadGVL(): Promise<GVL> {
    // Set the base URL for GVL - this is required by the IAB TCF library
    const baseUrl = this.gvlUrl.substring(0, this.gvlUrl.lastIndexOf('/') + 1);
    GVL.baseUrl = baseUrl;

    // Try to load from cache first
    const cached = this.getCachedGVL();
    if (cached) {
      try {
        const gvl = new GVL(cached.data);
        await gvl.readyPromise;
        return gvl;
      } catch (error) {
        console.warn('Failed to use cached GVL, fetching fresh:', error);
        this.clearCache();
      }
    }

    // Fetch from server
    try {
      console.log('Fetching GVL from:', this.gvlUrl);
      const response = await fetch(this.gvlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch GVL: ${response.status} ${response.statusText}`);
      }

      const gvlData = await response.json();
      console.log('GVL loaded successfully, version:', gvlData.vendorListVersion);
      
      // Cache the GVL data
      this.cacheGVL(gvlData);

      // Create and populate GVL instance
      const gvl = new GVL(gvlData);
      await gvl.readyPromise;
      
      return gvl;
    } catch (error) {
      console.error('Failed to load GVL from server:', error);
      console.warn('Using fallback GVL - this may not pass CMP validator checks');
      
      // Create a fallback GVL with minimal data
      return this.createFallbackGVL();
    }
  }

  /**
   * Create a fallback GVL with basic structure
   */
  private createFallbackGVL(): GVL {
    try {
      // Create a basic GVL with minimal TCF 2.2 data
      const fallbackGVLData = {
        tcfPolicyVersion: 4,
        gvlSpecificationVersion: 3,
        vendorListVersion: 1000, // Use a high version number to indicate it's current
        lastUpdated: new Date().toISOString(),
        purposes: {
          1: { id: 1, name: "Store and/or access information on a device", description: "Store and/or access information on a device", descriptionLegal: "Store and/or access information on a device" },
          2: { id: 2, name: "Select basic ads", description: "Select basic ads", descriptionLegal: "Select basic ads" },
          3: { id: 3, name: "Create a personalised ads profile", description: "Create a personalised ads profile", descriptionLegal: "Create a personalised ads profile" },
          4: { id: 4, name: "Select personalised ads", description: "Select personalised ads", descriptionLegal: "Select personalised ads" },
          5: { id: 5, name: "Create a personalised content profile", description: "Create a personalised content profile", descriptionLegal: "Create a personalised content profile" },
          6: { id: 6, name: "Select personalised content", description: "Select personalised content", descriptionLegal: "Select personalised content" },
          7: { id: 7, name: "Measure ad performance", description: "Measure ad performance", descriptionLegal: "Measure ad performance" },
          8: { id: 8, name: "Measure content performance", description: "Measure content performance", descriptionLegal: "Measure content performance" },
          9: { id: 9, name: "Apply market research to generate audience insights", description: "Apply market research to generate audience insights", descriptionLegal: "Apply market research to generate audience insights" },
          10: { id: 10, name: "Develop and improve products", description: "Develop and improve products", descriptionLegal: "Develop and improve products" }
        },
        specialPurposes: {},
        features: {},
        specialFeatures: {},
        stacks: {},
        vendors: {},
        encodingType: 0,
        maxVendorId: 0,
        isRangeEncoding: false,
        vendorRanges: []
      };
      
      const gvl = new GVL(fallbackGVLData);
      console.warn('Using fallback GVL with basic TCF 2.2 purposes - some features may be limited');
      return gvl;
    } catch (error) {
      console.error('Failed to create fallback GVL instance:', error);
      // This should not happen, but just in case
      throw new Error('Cannot initialize GVL - critical error');
    }
  }

  /**
   * Cache GVL data in localStorage
   */
  private cacheGVL(gvlData: any, cacheKey?: string): void {
    try {
      const cacheData = {
        data: gvlData,
        timestamp: Date.now(),
        version: gvlData.tcfPolicyVersion || 4
      };
      const keyToUse = cacheKey || GVLManager.GVL_CACHE_KEY;
      localStorage.setItem(keyToUse, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache GVL data:', error);
    }
  }

  /**
   * Get cached GVL data if it's still valid
   */
  private getCachedGVL(cacheKey?: string): { data: any; version: number } | null {
    try {
      const keyToUse = cacheKey || GVLManager.GVL_CACHE_KEY;
      const cached = localStorage.getItem(keyToUse);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheData.timestamp > GVLManager.CACHE_DURATION) {
        this.clearCache();
        return null;
      }

      return {
        data: cacheData.data,
        version: cacheData.version
      };
    } catch (error) {
      console.warn('Failed to read cached GVL:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Clear cached GVL data
   */
  private clearCache(): void {
    try {
      localStorage.removeItem(GVLManager.GVL_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear GVL cache:', error);
    }
  }
}