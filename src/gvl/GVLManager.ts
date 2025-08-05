import { GVL } from '@iabtcf/core';

export class GVLManager {
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
  public async getGVL(): Promise<GVL> {
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
      const response = await fetch(this.gvlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch GVL: ${response.status} ${response.statusText}`);
      }

      const gvlData = await response.json();
      
      // Cache the GVL data
      this.cacheGVL(gvlData);

      // Create and populate GVL instance
      const gvl = new GVL(gvlData);
      await gvl.readyPromise;
      
      return gvl;
    } catch (error) {
      console.error('Failed to load GVL:', error);
      
      // Create a fallback GVL with minimal data
      return this.createFallbackGVL();
    }
  }

  /**
   * Create a fallback GVL with basic structure
   */
  private createFallbackGVL(): GVL {
    try {
      // Try to create a basic empty GVL
      const gvl = new GVL();
      console.warn('Using empty GVL as fallback - some features may be limited');
      return gvl;
    } catch (error) {
      console.error('Failed to create any GVL instance:', error);
      // This should not happen, but just in case
      throw new Error('Cannot initialize GVL - critical error');
    }
  }

  /**
   * Cache GVL data in localStorage
   */
  private cacheGVL(gvlData: any): void {
    try {
      const cacheData = {
        data: gvlData,
        timestamp: Date.now(),
        version: gvlData.tcfPolicyVersion || 2
      };
      localStorage.setItem(GVLManager.GVL_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache GVL data:', error);
    }
  }

  /**
   * Get cached GVL data if it's still valid
   */
  private getCachedGVL(): { data: any; version: number } | null {
    try {
      const cached = localStorage.getItem(GVLManager.GVL_CACHE_KEY);
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