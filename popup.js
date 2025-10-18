// Khởi tạo khi popup mở
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStats();
  setupEventListeners();
});

// Load settings từ storage
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'isEnabled',
    'trackingEnabled',
    'malwareEnabled',
    'phishingEnabled',
    'httpsEnabled',
    'cookiesEnabled'
  ]);

  // Set main toggle
  const mainToggle = document.getElementById('mainToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (settings.isEnabled !== false) {
    mainToggle.classList.add('active');
    statusDot.classList.add('active');
    statusText.textContent = 'Đang Bảo Vệ';
  } else {
    mainToggle.classList.remove('active');
    statusDot.classList.remove('active');
    statusDot.classList.add('inactive');
    statusText.textContent = 'Tắt';
  }

  // Set feature toggles
  const features = ['tracking', 'malware', 'phishing', 'https', 'cookies'];
  features.forEach(feature => {
    const toggle = document.querySelector(`[data-feature="${feature}"]`);
    if (settings[`${feature}Enabled`] !== false) {
      toggle.classList.add('active');
    }
  });
}

// Update statistics
async function updateStats() {
  const stats = await chrome.storage.local.get(['blockedCount', 'threatCount']);
  
  document.getElementById('blockedCount').textContent = 
    (stats.blockedCount || 0).toLocaleString();
  document.getElementById('threatCount').textContent = 
    (stats.threatCount || 0).toLocaleString();
}

// Setup event listeners
function setupEventListeners() {
  // Main toggle
  document.getElementById('mainToggle').addEventListener('click', async (e) => {
    const toggle = e.currentTarget;
    const isActive = toggle.classList.contains('active');
    
    toggle.classList.toggle('active');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (isActive) {
      statusDot.classList.remove('active');
      statusDot.classList.add('inactive');
      statusText.textContent = 'Tắt';
      await chrome.storage.local.set({ isEnabled: false });
    } else {
      statusDot.classList.remove('inactive');
      statusDot.classList.add('active');
      statusText.textContent = 'Đang Bảo Vệ';
      await chrome.storage.local.set({ isEnabled: true });
    }

    // Notify background script
    chrome.runtime.sendMessage({ 
      action: 'toggleProtection', 
      enabled: !isActive 
    });
  });

  // Feature toggles
  document.querySelectorAll('.feature-toggle').forEach(toggle => {
    toggle.addEventListener('click', async (e) => {
      const feature = e.currentTarget.dataset.feature;
      const isActive = e.currentTarget.classList.contains('active');
      
      e.currentTarget.classList.toggle('active');
      
      await chrome.storage.local.set({ 
        [`${feature}Enabled`]: !isActive 
      });

      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'toggleFeature', 
        feature: feature,
        enabled: !isActive 
      });
    });
  });

  // Scan button
  document.getElementById('scanBtn').addEventListener('click', async () => {
    const btn = document.getElementById('scanBtn');
    btn.textContent = '⏳ Đang Quét...';
    btn.disabled = true;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send scan request
    chrome.runtime.sendMessage({ 
      action: 'scanPage', 
      tabId: tab.id,
      url: tab.url
    }, (response) => {
      if (response && response.success) {
        btn.textContent = '✅ Hoàn Tất!';
        setTimeout(() => {
          btn.textContent = '🔍 Quét Trang Hiện Tại';
          btn.disabled = false;
        }, 2000);
        
        // Update stats
        updateStats();
      } else {
        btn.textContent = '❌ Lỗi';
        setTimeout(() => {
          btn.textContent = '🔍 Quét Trang Hiện Tại';
          btn.disabled = false;
        }, 2000);
      }
    });
  });
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    updateStats();
  }
});