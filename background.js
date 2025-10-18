// ===== PAGE SCANNER =====
async function scanPage(tabId, url) {
  try {
    const urlObj = new URL(url);
    let issues = [];

    // Check 1: HTTPS
    if (urlObj.protocol === 'http:') {
      issues.push({ 
        type: 'no-https', 
        severity: 'high', 
        message: 'No HTTPS encryption' 
      });
    }

    // Check 2: Known threats
    if (THREAT_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
      issues.push({ 
        type: 'known-threat', 
        severity: 'critical', 
        message: 'Domain in blacklist' 
      });
    }

    // Check 3: IP address
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlObj.hostname)) {
      issues.push({ 
        type: 'ip-address', 
        severity: 'medium', 
        message: 'Using IP instead of domain' 
      });
    }

    // Check 4: IDN spoofing
    if (urlObj.hostname.includes('xn--')) {
      issues.push({ 
        type: 'idn-spoofing', 
        severity: 'high', 
        message: 'Possible IDN spoofing' 
      });
    }

    // Check 5: Suspicious port
    if (urlObj.port && SUSPICIOUS_PORTS.includes(urlObj.port)) {
      issues.push({ 
        type: 'suspicious-port', 
        severity: 'medium', 
        message: `Suspicious port: ${urlObj.port}` 
      });
    }

    // Check 6: Page content (if accessible)
    const specialProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:'];
    if (!specialProtocols.some(p => url.startsWith(p))) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: checkPageContent
        });

        if (results?.[0]?.result?.suspiciousElements > 0) {
          issues.push({ 
            type: 'suspicious-content', 
            severity: 'medium', 
            message: `${results[0].result.suspiciousElements} suspicious elements found` 
          });
        }
      } catch (scriptError) {
        console.warn('⚠️ Could not scan page content:', scriptError.message);
      }
    }

    // Generate report
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

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro - Scan Results',
      message: message,
      priority: 2
    });

    console.log('🔍 Scan complete:', totalIssues, 'issues found');
    return { success: true, issues: totalIssues, details: issues };

  } catch (error) {
    console.error('❌ Scan error:', error);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro',
      message: '⚠️ Cannot scan this page\n(System page or restricted)',
      priority: 1
    });
    
    return { success: false, error: error.message };
  }
}

// Function to inject into page for content analysis
function checkPageContent() {
  let suspicious = 0;

  try {
    // Check forms with HTTP action
    document.querySelectorAll('form').forEach(form => {
      if (form.action?.includes('http://')) suspicious++;
    });

    // Check suspicious scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.src.toLowerCase();
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
      const src = iframe.src || '';
      if (src.includes('http://') || src.includes('data:') || src.includes('javascript:')) {
        suspicious++;
      }
    });

    // Check inline scripts with suspicious patterns
    document.querySelectorAll('script:not([src])').forEach(script => {
      const content = script.textContent;
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

console.log('🛡️ SecureGuard Pro background service worker loaded'); // =====================================================
// SECUREGUARD PRO - BACKGROUND SERVICE WORKER
// =====================================================

// ===== CONFIGURATION =====
const THREAT_DOMAINS = [
  'malware-test.com',
  'phishing-test.net',
  'suspicious-site.xyz',
  'fake-bank.com',
  'secure-login-verify.tk'
];

const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.com', 
  '.pif', '.vbs', '.js', '.jar', '.msi',
  '.app', '.deb', '.rpm', '.dmg', '.apk',
  '.dll', '.sys', '.ps1'
];

const SUSPICIOUS_PORTS = ['8080', '8888', '3128', '8000', '9999'];

// ===== INITIALIZATION =====
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    isEnabled: true,
    trackingEnabled: true,
    malwareEnabled: true,
    phishingEnabled: true,
    httpsEnabled: true,
    realtimeEnabled: true,
    blockedCount: 0,
    threatCount: 0
  });

  console.log('✅ SecureGuard Pro initialized');
  await enableStaticRules();
});

// ===== STATIC RULES MANAGEMENT =====
async function enableStaticRules() {
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
// Track blocked requests via webRequest (for statistics only)
chrome.webRequest?.onBeforeRequest.addListener(
  async (details) => {
    const settings = await chrome.storage.local.get(['isEnabled', 'trackingEnabled']);
    if (!settings.isEnabled || !settings.trackingEnabled) return;

    const url = details.url.toLowerCase();
    const trackingKeywords = [
      'analytics', 'tracking', 'pixel', 'beacon', 
      'telemetry', 'stats', 'metrics', 'ads', 'doubleclick'
    ];

    if (trackingKeywords.some(keyword => url.includes(keyword))) {
      const stats = await chrome.storage.local.get(['blockedCount']);
      await chrome.storage.local.set({ 
        blockedCount: (stats.blockedCount || 0) + 1 
      });

      notifyPopupUpdate();
    }
  },
  { urls: ["<all_urls>"] }
);

// Notify popup to update stats
function notifyPopupUpdate() {
  try {
    chrome.runtime.sendMessage({ action: 'updateStats' });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

// ===== MALWARE & PHISHING DETECTION =====
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const settings = await chrome.storage.local.get(['isEnabled', 'malwareEnabled', 'phishingEnabled']);
  if (!settings.isEnabled || (!settings.malwareEnabled && !settings.phishingEnabled)) return;

  try {
    const url = new URL(details.url);
    const isThreat = THREAT_DOMAINS.some(domain => url.hostname.includes(domain));

    if (isThreat) {
      // Update statistics
      const stats = await chrome.storage.local.get(['threatCount']);
      await chrome.storage.local.set({ 
        threatCount: (stats.threatCount || 0) + 1 
      });

      // Show warning badge
      chrome.action.setBadgeText({ text: '⚠', tabId: details.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: details.tabId });

      // Redirect to warning page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('warning.html') + '?url=' + encodeURIComponent(details.url)
      });

      console.log('🚫 Blocked threat:', url.hostname);
      notifyPopupUpdate();
    }
  } catch (error) {
    console.error('❌ Error checking threat:', error);
  }
});

// ===== REAL-TIME PROTECTION =====
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const settings = await chrome.storage.local.get(['isEnabled', 'realtimeEnabled']);
  if (!settings.isEnabled || !settings.realtimeEnabled) return;

  try {
    const url = new URL(details.url);
    
    // Skip special URLs
    if (['chrome:', 'chrome-extension:', 'edge:', 'about:'].some(p => url.protocol === p)) {
      return;
    }
    
    let isSuspicious = false;
    let suspicionReason = '';

    // Pattern detection
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'IP Address detected';
    } else if (/[a-z0-9]{20,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Random string detected';
    } else if (/@/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = '@ Symbol (Phishing trick)';
    } else if (/\-{3,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Multiple dashes';
    } else if (/_{3,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Multiple underscores';
    } else if (url.hostname.includes('xn--')) {
      isSuspicious = true;
      suspicionReason = 'IDN Spoofing (Punycode)';
    } else if (url.port && SUSPICIOUS_PORTS.includes(url.port)) {
      isSuspicious = true;
      suspicionReason = `Suspicious port: ${url.port}`;
    }

    if (isSuspicious) {
      // Show badge
      chrome.action.setBadgeText({ text: '⚠', tabId: details.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: details.tabId });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⚠️ Real-time Protection',
        message: `Suspicious URL detected!\n\n${suspicionReason}\n\nHost: ${url.hostname}`,
        priority: 1
      });

      // Update statistics
      const stats = await chrome.storage.local.get(['threatCount']);
      await chrome.storage.local.set({ 
        threatCount: (stats.threatCount || 0) + 1 
      });

      console.log('⚠️ Real-time alert:', url.href, '-', suspicionReason);
      notifyPopupUpdate();
    } else {
      // Clear badge if safe
      chrome.action.setBadgeText({ text: '', tabId: details.tabId });
    }
  } catch (error) {
    console.error('❌ Real-time protection error:', error);
  }
});

// ===== DOWNLOAD PROTECTION =====
chrome.downloads?.onCreated?.addListener(async (downloadItem) => {
  const settings = await chrome.storage.local.get(['isEnabled', 'realtimeEnabled']);
  if (!settings.isEnabled || !settings.realtimeEnabled) return;

  const filename = downloadItem.filename.toLowerCase();
  const isDangerous = DANGEROUS_EXTENSIONS.some(ext => filename.endsWith(ext));

  if (isDangerous) {
    // Pause download immediately
    try {
      chrome.downloads.pause(downloadItem.id);
    } catch (e) {
      console.warn('⚠️ Could not pause download:', e);
    }

    // Show interactive notification
    chrome.notifications.create({
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
    }, (notificationId) => {
      chrome.storage.local.set({ [`download_${notificationId}`]: downloadItem.id });
    });

    // Update statistics
    const stats = await chrome.storage.local.get(['threatCount']);
    await chrome.storage.local.set({ 
      threatCount: (stats.threatCount || 0) + 1 
    });

    console.log('🚫 Dangerous download blocked:', downloadItem.filename);
    notifyPopupUpdate();
  }
});

// Handle notification button clicks
chrome.notifications?.onButtonClicked?.addListener(async (notificationId, buttonIndex) => {
  const data = await chrome.storage.local.get([`download_${notificationId}`]);
  const downloadId = data[`download_${notificationId}`];
  
  if (downloadId) {
    try {
      if (buttonIndex === 0) {
        // Cancel download
        chrome.downloads.cancel(downloadId);
        chrome.downloads.erase({ id: downloadId });
        console.log('✅ Download cancelled by user');
      } else {
        // Resume download (risky)
        chrome.downloads.resume(downloadId);
        console.log('⚠️ Download resumed by user (risky)');
      }
    } catch (e) {
      console.error('❌ Error handling download:', e);
    }
    
    chrome.notifications.clear(notificationId);
    chrome.storage.local.remove([`download_${notificationId}`]);
  }
});

// ===== MESSAGE HANDLERS =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleProtection') {
    handleToggleProtection(message.enabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'toggleFeature') {
    handleToggleFeature(message.feature, message.enabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'scanPage') {
    scanPage(message.tabId, message.url).then(result => {
      sendResponse(result);
    });
    return true;
  }

  return true;
});

async function handleToggleProtection(enabled) {
  await chrome.storage.local.set({ isEnabled: enabled });
  
  // Clear all badges if disabled
  if (!enabled) {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    });
  }
  
  console.log(enabled ? '✅ Protection enabled' : '⚠️ Protection disabled');
}

async function handleToggleFeature(feature, enabled) {
  await chrome.storage.local.set({ [`${feature}Enabled`]: enabled });
  
  // Clear badges if realtime protection disabled
  if (feature === 'realtime' && !enabled) {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    });
  }
  
  console.log(`${enabled ? '✅' : '⚠️'} ${feature} ${enabled ? 'enabled' : 'disabled'}`);
}

// ===== PAGE SCANNER =====
async function scanPage(tabId, url) {
  try {
    const urlObj = new URL(url);
    let issues = [];

    // Check 1: HTTPS
    if (urlObj.protocol === 'http:') {
      issues.push({ 
        type: 'no-https', 
        severity: 'high', 
        message: 'No HTTPS encryption' 
      });
    }

    // Check 2: Known threats
    if (THREAT_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
      issues.push({ 
        type: 'known-threat', 
        severity: 'critical', 
        message: 'Domain in blacklist' 
      });
    }

    // Check 3: IP address
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlObj.hostname)) {
      issues.push({ 
        type: 'ip-address', 
        severity: 'medium', 
        message: 'Using IP instead of domain' 
      });
    }

    // Check 4: IDN spoofing
    if (urlObj.hostname.includes('xn--')) {
      issues.push({ 
        type: 'idn-spoofing', 
        severity: 'high', 
        message: 'Possible IDN spoofing' 
      });
    }

    // Check 5: Suspicious port
    if (urlObj.port && SUSPICIOUS_PORTS.includes(urlObj.port)) {
      issues.push({ 
        type: 'suspicious-port', 
        severity: 'medium', 
        message: `Suspicious port: ${urlObj.port}` 
      });
    }

    // Check 6: Page content (if accessible)
    const specialProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:'];
    if (!specialProtocols.some(p => url.startsWith(p))) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: checkPageContent
        });

        if (results?.[0]?.result?.suspiciousElements > 0) {
          issues.push({ 
            type: 'suspicious-content', 
            severity: 'medium', 
            message: `${results[0].result.suspiciousElements} suspicious elements found` 
          });
        }
      } catch (scriptError) {
        console.warn('⚠️ Could not scan page content:', scriptError.message);
      }
    }

    // Generate report
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

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro - Scan Results',
      message: message,
      priority: 2
    });

    console.log('🔍 Scan complete:', totalIssues, 'issues found');
    return { success: true, issues: totalIssues, details: issues };

  } catch (error) {
    console.error('❌ Scan error:', error);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro',
      message: '⚠️ Cannot scan this page\n(System page or restricted)',
      priority: 1
    });
    
    return { success: false, error: error.message };
  }
}

// Function to inject into page for content analysis
function checkPageContent() {
  let suspicious = 0;

  try {
    // Check forms with HTTP action
    document.querySelectorAll('form').forEach(form => {
      if (form.action?.includes('http://')) suspicious++;
    });

    // Check suspicious scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.src.toLowerCase();
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
      const src = iframe.src || '';
      if (src.includes('http://') || src.includes('data:') || src.includes('javascript:')) {
        suspicious++;
      }
    });

    // Check inline scripts with suspicious patterns
    document.querySelectorAll('script:not([src])').forEach(script => {
      const content = script.textContent;
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

// Update blocking rules based on settings
async function updateBlockingRules(enabled) {
  try {
    if (enabled) {
      // Enable static rules
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ['tracking_rules']
      });
      console.log('Blocking rules enabled');
    } else {
      // Disable static rules
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ['tracking_rules']
      });
      console.log('Blocking rules disabled');
    }
  } catch (error) {
    console.error('Error updating rules:', error);
  }
}.id);
    
    if (!enabled || ruleIds.length === 0) {
      // Disable by removing all dynamic rules
      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        });
      }
    }
    
    console.log('Blocking rules updated:', enabled);
  } catch (error) {
    console.error('Error updating rules:', error);
  }
}

// ===== STATISTICS TRACKING =====
// Track blocked requests via webRequest (for statistics only)
chrome.webRequest?.onBeforeRequest.addListener(
  async (details) => {
    const settings = await chrome.storage.local.get(['isEnabled', 'trackingEnabled']);
    if (!settings.isEnabled || !settings.trackingEnabled) return;

    const url = details.url.toLowerCase();
    const trackingKeywords = [
      'analytics', 'tracking', 'pixel', 'beacon', 
      'telemetry', 'stats', 'metrics', 'ads', 'doubleclick'
    ];

    if (trackingKeywords.some(keyword => url.includes(keyword))) {
      const stats = await chrome.storage.local.get(['blockedCount']);
      await chrome.storage.local.set({ 
        blockedCount: (stats.blockedCount || 0) + 1 
      });

      notifyPopupUpdate();
    }
  },
  { urls: ["<all_urls>"] }
);

// Notify popup to update stats
function notifyPopupUpdate() {
  try {
    chrome.runtime.sendMessage({ action: 'updateStats' });
  } catch (e) {
    // Popup might be closed, ignore
  }
}

// ===== MALWARE & PHISHING DETECTION =====
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const settings = await chrome.storage.local.get(['isEnabled', 'malwareEnabled', 'phishingEnabled']);
  if (!settings.isEnabled || (!settings.malwareEnabled && !settings.phishingEnabled)) return;

  try {
    const url = new URL(details.url);
    const isThreat = THREAT_DOMAINS.some(domain => url.hostname.includes(domain));

    if (isThreat) {
      // Update statistics
      const stats = await chrome.storage.local.get(['threatCount']);
      await chrome.storage.local.set({ 
        threatCount: (stats.threatCount || 0) + 1 
      });

      // Show warning badge
      chrome.action.setBadgeText({ text: '⚠', tabId: details.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: details.tabId });

      // Redirect to warning page
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('warning.html') + '?url=' + encodeURIComponent(details.url)
      });

      console.log('🚫 Blocked threat:', url.hostname);
      notifyPopupUpdate();
    }
  } catch (error) {
    console.error('❌ Error checking threat:', error);
  }
});

// ===== REAL-TIME PROTECTION =====
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const settings = await chrome.storage.local.get(['isEnabled', 'realtimeEnabled']);
  if (!settings.isEnabled || !settings.realtimeEnabled) return;

  try {
    const url = new URL(details.url);
    
    // Skip special URLs
    if (['chrome:', 'chrome-extension:', 'edge:', 'about:'].some(p => url.protocol === p)) {
      return;
    }
    
    let isSuspicious = false;
    let suspicionReason = '';

    // Pattern detection
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'IP Address detected';
    } else if (/[a-z0-9]{20,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Random string detected';
    } else if (/@/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = '@ Symbol (Phishing trick)';
    } else if (/\-{3,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Multiple dashes';
    } else if (/_{3,}/.test(url.hostname)) {
      isSuspicious = true;
      suspicionReason = 'Multiple underscores';
    } else if (url.hostname.includes('xn--')) {
      isSuspicious = true;
      suspicionReason = 'IDN Spoofing (Punycode)';
    } else if (url.port && SUSPICIOUS_PORTS.includes(url.port)) {
      isSuspicious = true;
      suspicionReason = `Suspicious port: ${url.port}`;
    }

    if (isSuspicious) {
      // Show badge
      chrome.action.setBadgeText({ text: '⚠', tabId: details.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: details.tabId });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⚠️ Real-time Protection',
        message: `Suspicious URL detected!\n\n${suspicionReason}\n\nHost: ${url.hostname}`,
        priority: 1
      });

      // Update statistics
      const stats = await chrome.storage.local.get(['threatCount']);
      await chrome.storage.local.set({ 
        threatCount: (stats.threatCount || 0) + 1 
      });

      console.log('⚠️ Real-time alert:', url.href, '-', suspicionReason);
      notifyPopupUpdate();
    } else {
      // Clear badge if safe
      chrome.action.setBadgeText({ text: '', tabId: details.tabId });
    }
  } catch (error) {
    console.error('❌ Real-time protection error:', error);
  }
});

// ===== DOWNLOAD PROTECTION =====
chrome.downloads?.onCreated?.addListener(async (downloadItem) => {
  const settings = await chrome.storage.local.get(['isEnabled', 'realtimeEnabled']);
  if (!settings.isEnabled || !settings.realtimeEnabled) return;

  const filename = downloadItem.filename.toLowerCase();
  const isDangerous = DANGEROUS_EXTENSIONS.some(ext => filename.endsWith(ext));

  if (isDangerous) {
    // Pause download immediately
    try {
      chrome.downloads.pause(downloadItem.id);
    } catch (e) {
      console.warn('⚠️ Could not pause download:', e);
    }

    // Show interactive notification
    chrome.notifications.create({
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
    }, (notificationId) => {
      chrome.storage.local.set({ [`download_${notificationId}`]: downloadItem.id });
    });

    // Update statistics
    const stats = await chrome.storage.local.get(['threatCount']);
    await chrome.storage.local.set({ 
      threatCount: (stats.threatCount || 0) + 1 
    });

    console.log('🚫 Dangerous download blocked:', downloadItem.filename);
    notifyPopupUpdate();
  }
});

// Handle notification button clicks
chrome.notifications?.onButtonClicked?.addListener(async (notificationId, buttonIndex) => {
  const data = await chrome.storage.local.get([`download_${notificationId}`]);
  const downloadId = data[`download_${notificationId}`];
  
  if (downloadId) {
    try {
      if (buttonIndex === 0) {
        // Cancel download
        chrome.downloads.cancel(downloadId);
        chrome.downloads.erase({ id: downloadId });
        console.log('✅ Download cancelled by user');
      } else {
        // Resume download (risky)
        chrome.downloads.resume(downloadId);
        console.log('⚠️ Download resumed by user (risky)');
      }
    } catch (e) {
      console.error('❌ Error handling download:', e);
    }
    
    chrome.notifications.clear(notificationId);
    chrome.storage.local.remove([`download_${notificationId}`]);
  }
});

// Auto-clear cookies periodically
chrome.alarms.create('clearCookies', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clearCookies') {
    const settings = await chrome.storage.local.get(['isEnabled', 'realtimeEnabled']);
    
    if (settings.isEnabled && settings.realtimeEnabled) {
      const cookies = await chrome.cookies.getAll({});
      let cleared = 0;

      for (const cookie of cookies) {
        // Chỉ xóa cookies tracking, giữ lại cookies quan trọng
        if (isTrackingCookie(cookie)) {
          await chrome.cookies.remove({
            url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
            name: cookie.name
          });
          cleared++;
        }
      }

      if (cleared > 0) {
        console.log(`Real-time protection: Cleared ${cleared} tracking cookies`);
      }
    }
  }
});

// Helper function
function isTrackingCookie(cookie) {
  const trackingPatterns = ['_ga', '_gid', 'fbp', 'fr', '_fbp', 'utm_'];
  return trackingPatterns.some(pattern => cookie.name.includes(pattern));
}

// ===== MESSAGE HANDLERS =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleProtection') {
    handleToggleProtection(message.enabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'toggleFeature') {
    handleToggleFeature(message.feature, message.enabled).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'scanPage') {
    scanPage(message.tabId, message.url).then(result => {
      sendResponse(result);
    });
    return true;
  }

  return true;
});

async function handleToggleProtection(enabled) {
  await chrome.storage.local.set({ isEnabled: enabled });
  
  // Clear all badges if disabled
  if (!enabled) {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    });
  }
  
  console.log(enabled ? '✅ Protection enabled' : '⚠️ Protection disabled');
}

async function handleToggleFeature(feature, enabled) {
  await chrome.storage.local.set({ [`${feature}Enabled`]: enabled });
  
  // Clear badges if realtime protection disabled
  if (feature === 'realtime' && !enabled) {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    });
  }
  
  console.log(`${enabled ? '✅' : '⚠️'} ${feature} ${enabled ? 'enabled' : 'disabled'}`);
}

async function scanPage(tabId, url) {
  try {
    const urlObj = new URL(url);
    let issues = [];

    // Check for HTTPS
    if (urlObj.protocol === 'http:') {
      issues.push({ type: 'no-https', severity: 'high', message: 'Trang không sử dụng HTTPS' });
    }

    // Check against threat list
    const isThreat = THREAT_DOMAINS.some(domain => 
      urlObj.hostname.includes(domain)
    );
    if (isThreat) {
      issues.push({ type: 'known-threat', severity: 'critical', message: 'Domain nằm trong blacklist' });
    }

    // Check for suspicious patterns
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlObj.hostname)) {
      issues.push({ type: 'ip-address', severity: 'medium', message: 'URL sử dụng IP thay vì domain' });
    }

    if (urlObj.hostname.includes('xn--')) {
      issues.push({ type: 'idn-spoofing', severity: 'high', message: 'Phát hiện IDN spoofing' });
    }

    // Check if we can execute script on this tab
    if (!url.startsWith('chrome://') && !url.startsWith('edge://') && 
        !url.startsWith('chrome-extension://') && !url.startsWith('about:')) {
      try {
        // Execute content script to check for suspicious elements
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: checkPageContent
        });

        if (results && results[0] && results[0].result) {
          const pageIssues = results[0].result;
          if (pageIssues.suspiciousElements > 0) {
            issues.push({ 
              type: 'suspicious-content', 
              severity: 'medium', 
              message: `Phát hiện ${pageIssues.suspiciousElements} phần tử đáng ngờ` 
            });
          }
        }
      } catch (scriptError) {
        console.warn('Could not inject script:', scriptError);
      }
    }

    // Show detailed notification
    const totalIssues = issues.length;
    let message = '';
    
    if (totalIssues === 0) {
      message = '✅ Trang web an toàn!\n\nKhông phát hiện vấn đề bảo mật.';
    } else {
      const critical = issues.filter(i => i.severity === 'critical').length;
      const high = issues.filter(i => i.severity === 'high').length;
      const medium = issues.filter(i => i.severity === 'medium').length;
      
      message = `⚠️ Phát hiện ${totalIssues} vấn đề:\n\n`;
      if (critical > 0) message += `🔴 Nghiêm trọng: ${critical}\n`;
      if (high > 0) message += `🟠 Cao: ${high}\n`;
      if (medium > 0) message += `🟡 Trung bình: ${medium}\n`;
      message += `\n${issues.map(i => '• ' + i.message).join('\n')}`;
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro - Kết Quả Quét',
      message: message,
      priority: 2
    });

    return { success: true, issues: totalIssues, details: issues };
  } catch (error) {
    console.error('Scan error:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecureGuard Pro',
      message: '⚠️ Không thể quét trang này\n(Trang hệ thống hoặc bị giới hạn)',
      priority: 1
    });
    
    return { success: false, error: error.message };
  }
}

// Function to inject into page (must be a standalone function)
function checkPageContent() {
  let suspicious = 0;

  try {
    // Check for suspicious forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.action && form.action.includes('http://')) {
        suspicious++;
      }
    });

    // Check for suspicious scripts
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.src.toLowerCase();
      if (src.includes('eval') || src.includes('atob') || src.includes('.tk')) {
        suspicious++;
      }
    });

    // Check for password fields on non-HTTPS
    if (window.location.protocol === 'http:') {
      const passwordFields = document.querySelectorAll('input[type="password"]');
      if (passwordFields.length > 0) {
        suspicious++;
      }
    }

    // Check for suspicious iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src || '';
      if (src.includes('http://') || src.includes('data:') || src.includes('javascript:')) {
        suspicious++;
      }
    });

    // Check for inline scripts with suspicious patterns
    const allScripts = document.querySelectorAll('script:not([src])');
    allScripts.forEach(script => {
      const content = script.textContent;
      if (content.includes('eval(') || content.includes('fromCharCode') || 
          content.includes('unescape') || content.includes('atob(')) {
        suspicious++;
      }
    });

  } catch (error) {
    console.error('Page content check error:', error);
  }

  return { suspiciousElements: suspicious };
}