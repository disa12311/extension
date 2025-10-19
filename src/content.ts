// =====================================================
// CONTENT SCRIPT (TypeScript)
// =====================================================

import type { SecuritySettings, SecurityIssue, MessageAction } from './types';

(async function (): Promise<void> {
  'use strict';

  // Get settings
  const settings = await chrome.storage.local.get([
    'isEnabled',
    'trackingEnabled',
    'phishingEnabled'
  ]) as Partial<SecuritySettings>;

  if (!settings.isEnabled) return;

  // 1. Block tracking pixels
  if (settings.trackingEnabled) {
    blockTrackingPixels();
  }

  // 2. Detect phishing attempts
  if (settings.phishingEnabled) {
    detectPhishing();
  }

  // 3. Monitor suspicious behaviors
  monitorSuspiciousBehaviors();

  // 4. Protect against clickjacking
  preventClickjacking();
})();

// Block tracking pixels
function blockTrackingPixels(): void {
  const observer = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
      mutation.addedNodes.forEach((node: Node): void => {
        if (node instanceof HTMLImageElement || node instanceof HTMLIFrameElement) {
          const src = node.src || (node as HTMLElement).dataset.src;
          if (src && isTrackingUrl(src)) {
            node.remove();
            console.log('Blocked tracking pixel:', src);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Remove existing tracking pixels
  document.querySelectorAll<HTMLImageElement>('img[src*="pixel"], img[width="1"][height="1"]')
    .forEach((img: HTMLImageElement): void => {
      if (isTrackingUrl(img.src)) {
        img.remove();
      }
    });
}

function isTrackingUrl(url: string): boolean {
  const trackingPatterns: readonly string[] = [
    'analytics',
    'tracking',
    'pixel',
    'beacon',
    'telemetry',
    'metric'
  ];

  return trackingPatterns.some((pattern: string) =>
    url.toLowerCase().includes(pattern)
  );
}

// Detect phishing
function detectPhishing(): void {
  const url: string = window.location.href;
  const hostname: string = window.location.hostname;

  // Check for common phishing indicators
  const indicators: string[] = [];

  // 1. Check for suspicious TLDs
  const suspiciousTLDs: readonly string[] = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz'];
  if (suspiciousTLDs.some((tld: string) => hostname.endsWith(tld))) {
    indicators.push('Suspicious domain extension');
  }

  // 2. Check for URL obfuscation
  if (url.includes('@') || url.includes('%20') ||
    (url.match(/\./g) || []).length > 5) {
    indicators.push('URL obfuscation detected');
  }

  // 3. Check for mismatched domains in login forms
  const forms = document.querySelectorAll<HTMLFormElement>('form');
  forms.forEach((form: HTMLFormElement): void => {
    const passwordInput = form.querySelector<HTMLInputElement>('input[type="password"]');
    if (passwordInput && form.action) {
      try {
        const formDomain = new URL(form.action).hostname;
        if (formDomain !== hostname) {
          indicators.push('Form submits to different domain');
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });

  // 4. Check for fake SSL indicators
  const fakeSslIndicators = document.querySelectorAll<HTMLImageElement>('img[src*="lock"], img[alt*="secure"]');
  if (fakeSslIndicators.length > 0 && window.location.protocol !== 'https:') {
    indicators.push('Fake security indicators');
  }

  // Alert if phishing detected
  if (indicators.length >= 2) {
    showPhishingWarning(indicators);
  }
}

function showPhishingWarning(indicators: string[]): void {
  // Create warning overlay
  const overlay = document.createElement('div');
  overlay.id = 'secureguard-phishing-warning';
  overlay.innerHTML = `
    <style>
      #secureguard-phishing-warning {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', sans-serif;
      }
      #secureguard-warning-box {
        background: white;
        padding: 40px;
        border-radius: 15px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }
      #secureguard-warning-box h2 {
        color: #dc2626;
        font-size: 32px;
        margin-bottom: 20px;
      }
      #secureguard-warning-box p {
        color: #374151;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 15px;
      }
      #secureguard-warning-box ul {
        text-align: left;
        color: #6b7280;
        margin: 20px 0;
        padding-left: 20px;
      }
      #secureguard-warning-box li {
        margin: 8px 0;
      }
      .sg-btn {
        padding: 12px 30px;
        margin: 10px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      .sg-btn-danger {
        background: #dc2626;
        color: white;
      }
      .sg-btn-danger:hover {
        background: #b91c1c;
      }
      .sg-btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }
      .sg-btn-secondary:hover {
        background: #d1d5db;
      }
    </style>
    <div id="secureguard-warning-box">
      <h2>⚠️ Cảnh Báo Phishing!</h2>
      <p><strong>Trang web này có thể nguy hiểm!</strong></p>
      <p>SecureGuard Pro đã phát hiện các dấu hiệu đáng ngờ:</p>
      <ul>
        ${indicators.map((i: string) => `<li>${i}</li>`).join('')}
      </ul>
      <p>Đừng nhập thông tin cá nhân, mật khẩu hoặc thông tin tài chính!</p>
      <div>
        <button class="sg-btn sg-btn-danger" id="sg-leave-btn">🔙 Rời Khỏi Trang</button>
        <button class="sg-btn sg-btn-secondary" id="sg-continue-btn">⚠️ Tiếp Tục (Rủi Ro)</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  const leaveBtn = document.getElementById('sg-leave-btn');
  const continueBtn = document.getElementById('sg-continue-btn');

  leaveBtn?.addEventListener('click', (): void => {
    window.history.back();
  });

  continueBtn?.addEventListener('click', (): void => {
    overlay.remove();
  });
}

// Monitor suspicious behaviors
function monitorSuspiciousBehaviors(): void {
  // Detect multiple redirects
  let redirectCount = 0;
  const originalPushState = history.pushState;

  history.pushState = function (...args: Parameters<typeof history.pushState>): void {
    redirectCount++;
    if (redirectCount > 5) {
      console.warn('SecureGuard: Excessive redirects detected!');
      const message: MessageAction = {
        action: 'suspiciousBehavior',
        type: 'excessive_redirects'
      };
      chrome.runtime.sendMessage(message);
    }
    return originalPushState.apply(history, args);
  };

  // Detect clipboard hijacking attempts
  document.addEventListener('copy', (e: ClipboardEvent): void => {
    const selection = window.getSelection()?.toString() || '';
    setTimeout((): void => {
      navigator.clipboard.readText().then((clipboardText: string): void => {
        if (clipboardText !== selection && selection.length > 0) {
          console.warn('SecureGuard: Clipboard hijacking detected!');
          const message: MessageAction = {
            action: 'suspiciousBehavior',
            type: 'clipboard_hijacking'
          };
          chrome.runtime.sendMessage(message);
        }
      }).catch(() => { });
    }, 100);
  });

  // Detect auto-download attempts
  const observer = new MutationObserver((mutations: MutationRecord[]): void => {
    mutations.forEach((mutation: MutationRecord): void => {
      mutation.addedNodes.forEach((node: Node): void => {
        if (node instanceof HTMLAnchorElement && node.hasAttribute('download')) {
          const href = node.href;
          if (href && !(node.dataset.sgChecked)) {
            node.dataset.sgChecked = 'true';
            console.warn('SecureGuard: Auto-download detected:', href);

            // Check file extension
            const suspiciousExtensions: readonly string[] = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.jar'];
            if (suspiciousExtensions.some((ext: string) => href.toLowerCase().endsWith(ext))) {
              node.remove();
              alert('SecureGuard đã chặn file nguy hiểm: ' + href);
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Prevent clickjacking
function preventClickjacking(): void {
  // Check if page is in iframe
  if (window.self !== window.top) {
    try {
      // Try to access parent URL
      const parentUrl = window.parent.location.href;
      const currentUrl = window.location.href;

      // If we can't access parent URL, it might be clickjacking
      if (!parentUrl) {
        document.body.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1f2937;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
            z-index: 999999;
          ">
            <div style="text-align: center; padding: 40px;">
              <h1 style="font-size: 48px; margin-bottom: 20px;">🛡️</h1>
              <h2>SecureGuard Pro</h2>
              <p style="margin: 20px 0;">Trang này có thể bị nhúng vào một trang web độc hại.</p>
              <a href="${currentUrl}" style="
                display: inline-block;
                padding: 12px 30px;
                background: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin-top: 20px;
              ">Mở Trang An Toàn</a>
            </div>
          </div>
        `;
      }
    } catch (e) {
      // Cross-origin error - potential clickjacking
      console.warn('SecureGuard: Potential clickjacking detected');
    }
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener(
  (message: MessageAction, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): boolean => {
    if (message.action === 'checkSecurity') {
      const result = performSecurityCheck();
      sendResponse(result);
    }
    return true;
  }
);

interface SecurityCheckResult {
  issues: SecurityIssue[];
  safe: boolean;
}

function performSecurityCheck(): SecurityCheckResult {
  const issues: SecurityIssue[] = [];

  // Check HTTPS
  if (window.location.protocol !== 'https:') {
    issues.push({ type: 'no-https', severity: 'high', message: 'No HTTPS' });
  }

  // Check for password fields on HTTP
  if (window.location.protocol === 'http:') {
    const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    if (passwordFields.length > 0) {
      issues.push({ type: 'password-on-http', severity: 'critical', message: 'Password on HTTP' });
    }
  }

  // Check for mixed content
  const insecureResources = document.querySelectorAll<HTMLElement>('img[src^="http:"], script[src^="http:"]');
  if (insecureResources.length > 0) {
    issues.push({
      type: 'mixed-content',
      severity: 'medium',
      message: 'Mixed content',
      count: insecureResources.length
    });
  }

  // Check for suspicious scripts
  const scripts = document.querySelectorAll<HTMLScriptElement>('script');
  let suspiciousScripts = 0;
  scripts.forEach((script: HTMLScriptElement): void => {
    const content = script.textContent || '';
    if (content.includes('eval(') || content.includes('atob(') || content.includes('fromCharCode')) {
      suspiciousScripts++;
    }
  });
  if (suspiciousScripts > 0) {
    issues.push({
      type: 'suspicious-scripts',
      severity: 'high',
      message: 'Suspicious scripts',
      count: suspiciousScripts
    });
  }

  return { issues, safe: issues.length === 0 };
}