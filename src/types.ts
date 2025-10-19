// =====================================================
// TYPE DEFINITIONS FOR SECUREGUARD PRO
// =====================================================

export interface SecuritySettings {
  isEnabled: boolean;
  trackingEnabled: boolean;
  malwareEnabled: boolean;
  phishingEnabled: boolean;
  httpsEnabled: boolean;
  realtimeEnabled: boolean;
  blockedCount: number;
  threatCount: number;
}

export interface SecurityIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  count?: number;
}

export type IssueType =
  | 'no-https'
  | 'known-threat'
  | 'ip-address'
  | 'idn-spoofing'
  | 'suspicious-port'
  | 'suspicious-content'
  | 'password-on-http'
  | 'mixed-content'
  | 'suspicious-scripts';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ScanResult {
  success: boolean;
  issues: number;
  details: SecurityIssue[];
  error?: string;
}

export interface PageContentResult {
  suspiciousElements: number;
}

export interface MessageAction {
  action: 'toggleProtection' | 'toggleFeature' | 'scanPage' | 'updateStats' | 'suspiciousBehavior';
  enabled?: boolean;
  feature?: string;
  tabId?: number;
  url?: string;
  type?: string;
}

export interface MessageResponse {
  success: boolean;
  error?: string;
  issues?: number;
  details?: SecurityIssue[];
}

export interface NotificationOptions {
  type: 'basic';
  iconUrl: string;
  title: string;
  message: string;
  priority: number;
  requireInteraction?: boolean;
  buttons?: Array<{ title: string }>;
}

export interface DownloadItem {
  id: number;
  filename: string;
  url: string;
  state: string;
}

export const THREAT_DOMAINS: readonly string[] = [
  'malware-test.com',
  'phishing-test.net',
  'suspicious-site.xyz',
  'fake-bank.com',
  'secure-login-verify.tk'
] as const;

export const DANGEROUS_EXTENSIONS: readonly string[] = [
  '.exe', '.scr', '.bat', '.cmd', '.com',
  '.pif', '.vbs', '.js', '.jar', '.msi',
  '.app', '.deb', '.rpm', '.dmg', '.apk',
  '.dll', '.sys', '.ps1'
] as const;

export const SUSPICIOUS_PORTS: readonly string[] = [
  '8080', '8888', '3128', '8000', '9999'
] as const;

export const TRACKING_KEYWORDS: readonly string[] = [
  'analytics', 'tracking', 'pixel', 'beacon',
  'telemetry', 'stats', 'metrics', 'ads', 'doubleclick'
] as const;

export const SPECIAL_PROTOCOLS: readonly string[] = [
  'chrome:', 'chrome-extension:', 'edge:', 'about:'
] as const;