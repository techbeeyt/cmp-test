import { TCData } from '@iabtcf/cmpapi';

export interface CMPConfig {
  cmpId: number;
  cmpVersion: number;
  cookieMaxAgeSeconds?: number;
  defaultLang?: string;
  gvlLocation?: string;
  storeConsentGlobally?: boolean;
  uiOptions?: UIOptions;
}

export interface UIOptions {
  theme?: 'light' | 'dark';
  position?: 'bottom' | 'top' | 'center';
  primaryColor?: string;
  showVendorCount?: boolean;
  showPurposeDescriptions?: boolean;
}

export interface ConsentData {
  tcString: string;
  tcfPolicyVersion: number;
  cmpId: number;
  cmpVersion: number;
  created: Date;
  lastUpdated: Date;
  isServiceSpecific: boolean;
  useNonStandardStacks: boolean;
  purposeOneTreatment: boolean;
  publisherCC: string;
}

export interface VendorConsent {
  [vendorId: number]: boolean;
}

export interface PurposeConsent {
  [purposeId: number]: boolean;
}

export interface CMPCallbacks {
  onConsentChanged?: (tcData: TCData) => void;
  onCMPUIShown?: () => void;
  onCMPUIHidden?: () => void;
  onError?: (error: Error) => void;
}

export interface CMPState {
  gdprApplies: boolean;
  cmpLoaded: boolean;
  cmpDisplayStatus: 'hidden' | 'visible' | 'disabled';
  signalStatus: 'not ready' | 'loading' | 'ready';
  tcString?: string;
  tcfPolicyVersion?: number;
  cmpId?: number;
  cmpVersion?: number;
  eventStatus: 'tcloaded' | 'cmpuishown' | 'useractioncomplete';
  isAMP: boolean;
}

export enum ConsentStatus {
  NOT_SET = 'not_set',
  GRANTED = 'granted',
  DENIED = 'denied'
}

export enum CMPDisplayStatus {
  HIDDEN = 'hidden',
  VISIBLE = 'visible',
  DISABLED = 'disabled'
}

export enum EventStatus {
  TC_LOADED = 'tcloaded',
  CMP_UI_SHOWN = 'cmpuishown',
  USER_ACTION_COMPLETE = 'useractioncomplete'
}

export enum SignalStatus {
  NOT_READY = 'not ready',
  LOADING = 'loading',
  READY = 'ready'
}