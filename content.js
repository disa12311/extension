// Content script chạy trên mọi trang web

(async function() {
  'use strict';

  // Lấy settings
  const settings = await chrome.storage.local.get([
    'isEnabled',
    'trackingEnabled',
    'phishingEnabled'
  ]);

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
function blockTrackingPixels() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'IMG' || node.tagName === 'IFRAME') {
          const src = node.src || node.dataset.src;
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
  document.querySelectorAll('img[src*="pixel"], img[width="1"][height="1"]').forEach(img => {
    if (isTrackingUrl(img.src)) {
      img.remove();
    }
  });
}

function isTrackingUrl(url) {
  const trackingPatterns = [
    'analytics',
    'tracking',
    'pixel',
    'beacon',
    'telemetry',
    'metric'
  ];
  
  return trackingPatterns.some(pattern => 
    url.toLowerCase().includes(pattern)
  );
}

// Detect phishing
function detectPhishing() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  // Check for common phishing indicators
  const indicators = [];

  // 1. Check for suspicious TLDs
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz'];
  if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) {
    indicators.push('Suspicious domain extension');
  }

  // 2. Check for URL obfuscation
  if (url.includes('@') || url.includes('%20') || 
      (url.match(/\./g) || []).length > 5) {
    indicators.push('URL obfuscation detected');
  }

  // 3. Check for mismatched domains in login forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const passwordInput = form.querySelector('input[type="password"]');
    if (passwordInput && form.action) {
      const formDomain = new URL(form.action).hostname;
      if (formDomain !== hostname) {
        indicators.push('Form submits to different domain');
      }
    }
  });

  // 4. Check for fake SSL indicators
  const fakeSslIndicators = document.querySelectorAll('img[src*="lock"], img[alt*="secure"]');
  if (fakeSslIndicators.length > 0 && window.location.protocol !== 'https:') {
    indicators.push('Fake security indicators');
  }

  // Alert if phishing detected
  if (indicators.length >= 2) {
    showPhishingWarning(indicators);
  }
}

function showPhishingWarning(indicators) {
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
        ${indicators.map(i => `<li>${i}</li>`).join('')}
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
  document.getElementById('sg-leave-btn').addEventListener('click', () => {
    window.history.back();
  });

  document.getElementById('sg-continue-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

// Monitor suspicious behaviors
function monitorSuspiciousBehaviors() {
  // Detect multiple redirects
  let redirectCount = 0;
  const originalPushState = history.pushState;
  
  history.pushState = function() {
    redirectCount++;
    if (redirectCount > 5) {
      console.warn('SecureGuard: Excessive redirects detected!');
      chrome.runtime.sendMessage({ 
        action: 'suspiciousBehavior', 
        type: 'excessive_redirects' 
      });
    }
    return originalPushState.apply(history, arguments);
  };

  // Detect clipboard hijacking attempts
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection().toString();
    setTimeout(() => {
      navigator.clipboard.readText().then(clipboardText => {
        if (clipboardText !== selection && selection.length > 0) {
          console.warn('SecureGuard: Clipboard hijacking detected!');
          chrome.runtime.sendMessage({ 
            action: 'suspiciousBehavior', 
            type: 'clipboard_hijacking' 
          });
        }
      }).catch(() => {});
    }, 100);
  });

  // Detect auto-download attempts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'A' && node.hasAttribute('download')) {
          const href = node.href;
          if (href && !node.dataset.sgChecked) {
            node.dataset.sgChecked = 'true';
            console.warn('SecureGuard: Auto-download detected:', href);
            
            // Check file extension
            const suspiciousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.jar'];
            if (suspiciousExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
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
function preventClickjacking() {
  // Check if page is in iframe
  if (window.self !== window.top) {
    // Check if it's a legitimate iframe
    try {
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkSecurity') {
    const result = performSecurityCheck();
    sendResponse(result);
  }
  return true;
});

function performSecurityCheck() {
  const issues = [];

  // Check HTTPS
  if (window.location.protocol !== 'https:') {
    issues.push({ type: 'no-https', severity: 'high' });
  }

  // Check for password fields on HTTP
  if (window.location.protocol === 'http:') {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0) {
      issues.push({ type: 'password-on-http', severity: 'critical' });
    }
  }

  // Check for mixed content
  const insecureResources = document.querySelectorAll('img[src^="http:"], script[src^="http:"]');
  if (insecureResources.length > 0) {
    issues.push({ type: 'mixed-content', severity: 'medium', count: insecureResources.length });
  }

  // Check for suspicious scripts
  const scripts = document.querySelectorAll('script');
  let suspiciousScripts = 0;
  scripts.forEach(script => {
    const content = script.textContent;
    if (content.includes('eval(') || content.includes('atob(') || content.includes('fromCharCode')) {
      suspiciousScripts++;
    }
  });
  if (suspiciousScripts > 0) {
    issues.push({ type: 'suspicious-scripts', severity: 'high', count: suspiciousScripts });
  }

  return { issues: issues, safe: issues.length === 0 };
}