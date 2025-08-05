import { ConsentData } from '@/types';

export class StorageManager {
  private static readonly CONSENT_COOKIE_NAME = 'euconsent-v2';
  private static readonly CONSENT_STORAGE_KEY = 'tcf_consent_data';
  private static readonly DEFAULT_MAX_AGE = 33696000; // 13 months in seconds

  constructor(private maxAgeSeconds: number = StorageManager.DEFAULT_MAX_AGE) {}

  /**
   * Store consent data in both cookie and localStorage
   */
  public storeConsent(tcString: string, consentData: ConsentData): void {
    try {
      // Store TC string in cookie for server-side access
      this.setCookie(StorageManager.CONSENT_COOKIE_NAME, tcString, this.maxAgeSeconds);
      
      // Store detailed consent data in localStorage for client-side access
      const storageData = {
        ...consentData,
        created: consentData.created.toISOString(),
        lastUpdated: consentData.lastUpdated.toISOString()
      };
      localStorage.setItem(StorageManager.CONSENT_STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to store consent data:', error);
    }
  }

  /**
   * Retrieve TC string from cookie
   */
  public getTCString(): string | null {
    return this.getCookie(StorageManager.CONSENT_COOKIE_NAME);
  }

  /**
   * Retrieve full consent data from localStorage
   */
  public getConsentData(): ConsentData | null {
    try {
      const stored = localStorage.getItem(StorageManager.CONSENT_STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        ...data,
        created: new Date(data.created),
        lastUpdated: new Date(data.lastUpdated)
      };
    } catch (error) {
      console.error('Failed to retrieve consent data:', error);
      return null;
    }
  }

  /**
   * Clear all stored consent data
   */
  public clearConsent(): void {
    try {
      this.deleteCookie(StorageManager.CONSENT_COOKIE_NAME);
      localStorage.removeItem(StorageManager.CONSENT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear consent data:', error);
    }
  }

  /**
   * Check if consent has expired
   */
  public isConsentExpired(): boolean {
    const consentData = this.getConsentData();
    if (!consentData) return true;

    const now = new Date();
    const expirationTime = new Date(consentData.created.getTime() + (this.maxAgeSeconds * 1000));
    
    return now > expirationTime;
  }

  /**
   * Set a cookie with proper attributes
   */
  private setCookie(name: string, value: string, maxAge: number): void {
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
    const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
    document.cookie = cookieString;
  }

  /**
   * Get cookie value
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  /**
   * Delete a cookie
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}