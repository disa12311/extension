// =====================================================
// SECUREGUARD PRO - BACKGROUND SERVICE WORKER (TypeScript)
// =====================================================

import type {
  SecuritySettings,
  SecurityIssue,
  ScanResult,
  PageContentResult,
  MessageAction,
  MessageResponse,
  DownloadItem
} from './types';

import {
  THREAT_DOMAINS,
  DANGEROUS_EXTENSIONS,
  SUSPICIOUS_PORTS,
  TRACKING_KEYWORDS,
  SPECIAL_PROTOCOLS
} from './types';

// ===== INITIALIZATION =====
chrome.runtime.onInstalled.addListener(async (): Promise<void> => {
  const defaultSettings: SecuritySettings = {
    isEnabled: true,
    trackingEnabled: true,
    malwareEnabled: true,
    phishingEnabled: true,
    httpsEnabled: true,
    realtimeEnabled: true,
    blockedCount: 0,
    threatCount: 0
  };

  await chrome.storage.local.set(defaultSettings);
  console.log('✅ SecureGuard Pro initialized');
  await enableStaticRules();
});

// ===== STATIC RULES MANAGEMENT =====
async function enableStaticRules(): Promise<void> {
  try {
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();

    if (!enabledRulesets.includes('tracking_rules')) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['tracking_rules']
      });
      console.log('✅ Tracking rules enabled');
    }
  } catch (error) {
    console.error('❌ Error enabling rules:', error);
  }
}

// ===== STATISTICS TRACKING =====
chrome.webRequest?.onBeforeRequest.addListener(
  (details: chrome.webRequest.WebRequestBodyDetails): void => {
    getSettings(['isEnabled', 'trackingEnabled']).then(settings => {
      if (!settings.isEnabled || !settings.trackingEnabled) return;

      const url = details.url.toLowerCase();
      const isTracking = TRACKING_KEYWORDS.some(keyword => url.includes(keyword));

      if (isTracking) {
        incrementBlockedCount();
        notifyPopupUpdate();
      }
    });
  },
  { urls: ['<all_urls>'] }
);

// ===== MALWARE & PHISHING DETECTION =====
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details: chrome.webNavigation.WebNavigationParentedCallbackDetails): Promise<void> => {
    if (details.frameId !== 0) return;

    const settings = await getSettings(['isEnabled', 'malwareEnabled', 'phishingEnabled']);
    if (!settings.isEnabled || (!settings.malwareEnabled && !settings.phishingEnabled)) return;

    try {
      const url = new URL(details.url);
      const isThreat = THREAT_DOMAINS.some(domain => url.hostname.includes(domain));

      if (isThreat) {
        await incrementThreatCount();

        // Show warning badge
        await chrome.action.setBadgeText({ text: '⚠', tabId: details.tabId });
        await chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: details.tabId });

        // Redirect to warning page
        await chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('warning.html') + '?url=' + encodeURIComponent(details.url)
        });

        console.log('🚫 Blocked threat:', url.hostname);
        notifyPopupUpdate();
      }
    } catch (error) {
      console.error('❌ Error checking threat:', error);
    }
  }
);

// ===== REAL-TIME PROTECTION =====
chrome.webNavigation.onCommitted.addListener(
  async (details: chrome.webNavigation.WebNavigationTransitionCallbackDetails): Promise<void> => {
    if (details.frameId !== 0) return;

    const settings = await getSettings(['isEnabled', 'realtimeEnabled']);
    if (!settings.isEnabled || !settings.realtimeEnabled) return;

    try {
      const url = new URL(details.url);

      // Skip special URLs
      if (SPECIAL_PROTOCOLS.some(p => url.protocol === p)) return;

      const { isSuspicious, reason } = analyzeSuspiciousUrl(url);

      if (isSuspicious) {
        await showRealtimeWarning(details.tabId, url.hostname, reason);
        await incrementThreatCount();
        notifyPopupUpdate();
      } else {
        await chrome.action.setBadgeText({ text: '', tabId: details.tabId });
      }
    } catch (error) {
      console.error('❌ Real-time protection error:', error);
    }
  }
);

// ===== DOWNLOAD PROTECTION =====
chrome.downloads?.onCreated?.addListener(async (downloadItem: DownloadItem): Promise<void> => {
  const settings = await getSettings(['isEnabled', 'realtimeEnabled']);
  if (!settings.isEnabled || !settings.realtimeEnabled) return;

  const filename = downloadItem.filename.toLowerCase();
  const isDangerous = DANGEROUS_EXTENSIONS.some(ext => filename.endsWith(ext));

  if (isDangerous) {
    try {
      await chrome.downloads.pause(downloadItem.id);
    } catch (e) {
      console.warn('⚠️ Could not pause download:', e);
    }

    await showDownloadWarning(downloadItem);
    await incrementThreatCount();
    notifyPopupUpdate();
  }
});

// Handle notification button clicks
chrome.notifications?.onButtonClicked?.addListener(
  async (notificationId: string, buttonIndex: number): Promise<void> => {
    const data = await chrome.storage.local.get([`download_${notificationId}`]);
    const downloadId = data[`download_${notificationId}`] as number;

    if (downloadId) {
      try {
        if (buttonIndex === 0) {
          await chrome.downloads.cancel(downloadId);
          await chrome.downloads.erase({ id: downloadId });
          console.log('✅ Download cancelled by user');
        } else {
          await chrome.downloads.resume(downloadId);
          console.log('⚠️ Download resumed by user (risky)');
        }
      } catch (e) {
        console.error('❌ Error handling download:', e);
      }

      await chrome.notifications.clear(notificationId);
      await chrome.storage.local.remove([`download_${notificationId}`]);
    }
  }
);

// ===== MESSAGE HANDLERS =====
chrome.runtime.onMessage.addListener(
  (message: MessageAction, _sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void): boolean => {
    if (message.action === 'toggleProtection') {
      handleToggleProtection(message.enabled!).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === 'toggleFeature') {
      handleToggleFeature(message.feature!, message.enabled!).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === 'scanPage') {
      scanPage(message.tabId!, message.url!).then(result => {
        sendResponse(result);
      });
      return true;
    }

    return true;
  }
);

// ===== HELPER FUNCTIONS =====
async function getSettings(keys: string[]): Promise<Partial<SecuritySettings>> {
  return await chrome.storage.local.get(keys) as Partial<SecuritySettings>;
}

async function incrementBlockedCount(): Promise<void> {
  const stats = await chrome.storage.local.get(['blockedCount']);
  await chrome.storage.local.set({
    blockedCount: (stats.blockedCount || 0) + 1
  });
}

async function incrementThreatCount(): Promise<void> {
  const stats = await chrome.storage.local.get(['threatCount']);
  await chrome.storage.local.set({
    threatCount: (stats.threatCount || 0) + 1
  });
}

function notifyPopupUpdate(): void {
  try {
    chrome.runtime.sendMessage({ action: 'updateStats' });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

function analyzeSuspiciousUrl(url: URL): { isSuspicious: boolean; reason: string } {
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url.hostname)) {
    return { isSuspicious: true, reason: 'IP Address detected' };
  }
  if (/[a-z0-9]{20,}/.test(url.hostname)) {
    return { isSuspicious: true, reason: 'Random string detected' };
  }
  if (/@/.test(url.hostname)) {
    return { isSuspicious: true, reason: '@ Symbol (Phishing trick)' };
  }
  if (/\-{3,}/.test(url.hostname)) {
    return { isSuspicious: true, reason: 'Multiple dashes' };
  }
  if (/_{3,}/.test(url.hostname)) {
    return { isSuspicious: true, reason: 'Multiple underscores' };
  }
  if (url.hostname.includes('xn--')) {
    return { isSuspicious: true, reason: 'IDN Spoofing (Punycode)' };
  }
  if (url.port && SUSPICIOUS_PORTS.includes(url.port)) {
    return { isSuspicious: true, reason: `Suspicious port: ${url.port}` };
  }
  return { isSuspicious: false, reason: '' };
}

async function showRealtimeWarning(tabId: number, hostname: string, reason: string): Promise<void> {
  await chrome.action.setBadgeText({ text: '⚠', tabId });
  await chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId });

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '⚠️ Real-time Protection',
    message: `Suspicious URL detected!\n\n${reason}\n\nHost: ${hostname}`,
    priority: 1
  });

  console.log('⚠️ Real-time alert:', hostname, '-', reason);
}

async function showDownloadWarning(downloadItem: DownloadItem): Promise<void> {
  const notificationId = await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '⚠️ Dangerous Download Blocked',
    message: `File: ${downloadItem.filename}\n\nThis file type can contain malware!\nPlease verify the source before opening.`,
    priority: 2,
    requireInteraction: true,
    buttons: [
      { title: '🗑️ Cancel Download' },
      { title: '⚠️ Continue (Risky)' }
    ]
  });

  await chrome.storage.local.set({ [`download_${notificationId}`]: downloadItem.id });
  console.log('🚫 Dangerous download blocked:', downloadItem.filename);
}

async function handleToggleProtection(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ isEnabled: enabled });

  if (!enabled) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        await chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }
    }
  }

  console.log(enabled ? '✅ Protection enabled' : '⚠️ Protection disabled');
}

async function handleToggleFeature(feature: string, enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [`${feature}Enabled`]: enabled });

  if (feature === 'realtime' && !enabled) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        await chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }
    }
  }

  console.log(`${enabled ? '✅' : '⚠️'} ${feature} ${enabled ? 'enabled' : 'disabled'}`);
}

// ===== PAGE SCANNER =====
async function scanPage(tabId: number, url: string): Promise<ScanResult> {
  try {
    const urlObj = new URL(url);
    const issues: SecurityIssue[] = [];

    // Check HTTPS
    if (urlObj.protocol === 'http:') {
      issues.push({
        type: 'no-https',
        severity: 'high',
        message: 'No HTTPS encryption'
      });
    }

    // Check known threats
    if (THREAT_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
      issues.push({
        type: 'known-threat',
        severity: 'critical',
        message: 'Domain in blacklist'
      });
    }

    // Check IP address
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlObj.hostname)) {
      issues.push({
        type: 'ip-address',
        severity: 'medium',
        message: 'Using IP instead of domain'
      });
    }

    // Check IDN spoofing
    if (urlObj.hostname.includes('xn--')) {
      issues.push({
        type: 'idn-spoofing',
        severity: 'high',
        message: 'Possible IDN spoofing'
      });
    }

    // Check suspicious port
    if (urlObj.port && SUSPICIOUS_PORTS.includes(urlObj.port)) {
      issues.push({
        type: 'suspicious-port',
        severity: 'medium',
        message: `Suspicious port: ${urlObj.port}`
      });
    }

    // Check page content
    if (!SPECIAL_PROTOCOLS.some(p => url.startsWith(p))) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: checkPageContent
        });

        const suspiciousCount = results?.[0]?.result?.suspiciousElements;
        if (suspiciousCount && suspiciousCount > 0) {
          issues.push({
            type: 'suspicious-content',
            severity: 'medium',
            message: `${suspiciousCount} suspicious elements found`
          });
        }
      } catch (scriptError) {
        console.warn('⚠️ Could not scan page content:', (scriptError as Error).message);
      }
    }

    await showScanNotification(issues);
    console.log('🔍 Scan complete:', issues.length, 'issues found');

    return {
      success: true,
      issues: issues.length,
      details: issues
    };
  } catch (error) {
    console.error('❌ Scan error:', error);

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro',
      message: '⚠️ Cannot scan this page\n(System page or restricted)',
      priority: 1
    });

    return {
      success: false,
      issues: 0,
      details: [],
      error: (error as Error).message
    };
  }
}

async function showScanNotification(issues: SecurityIssue[]): Promise<void> {
  const totalIssues = issues.length;
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;

  let message = '';
  if (totalIssues === 0) {
    message = '✅ Page is secure!\n\nNo security issues detected.';
  } else {
    message = `⚠️ Found ${totalIssues} issue${totalIssues > 1 ? 's' : ''}:\n\n`;
    if (critical > 0) message += `🔴 Critical: ${critical}\n`;
    if (high > 0) message += `🟠 High: ${high}\n`;
    if (medium > 0) message += `🟡 Medium: ${medium}\n`;
    message += `\n${issues.map(i => '• ' + i.message).join('\n')}`;
  }

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'SecureGuard Pro - Scan Results',
    message,
    priority: 2
  });
}

// Function to inject into page
function checkPageContent(): PageContentResult {
  let suspicious = 0;

  try {
    // Check forms with HTTP action
    document.querySelectorAll('form').forEach(form => {
      if ((form as HTMLFormElement).action?.includes('http://')) suspicious++;
    });

    // Check suspicious scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = (script as HTMLScriptElement).src.toLowerCase();
      if (src.includes('eval') || src.includes('atob') || src.includes('.tk')) {
        suspicious++;
      }
    });

    // Check password fields on HTTP
    if (window.location.protocol === 'http:') {
      const passwordFields = document.querySelectorAll('input[type="password"]');
      if (passwordFields.length > 0) suspicious++;
    }

    // Check suspicious iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      const src = (iframe as HTMLIFrameElement).src || '';
      if (src.includes('http://') || src.includes('data:') || src.includes('javascript:')) {
        suspicious++;
      }
    });

    // Check inline scripts
    document.querySelectorAll('script:not([src])').forEach(script => {
      const content = script.textContent || '';
      if (content.includes('eval(') || content.includes('fromCharCode') ||
        content.includes('unescape') || content.includes('atob(')) {
        suspicious++;
      }
    });
  } catch (error) {
    console.error('Content check error:', error);
  }

  return { suspiciousElements: suspicious };
}

// =====================================================
// END OF BACKGROUND SERVICE WORKER
// =====================================================

console.log('🛡️ SecureGuard Pro background service worker loaded');