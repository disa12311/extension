// Popup logic cho YouTube Video Fix Pro
const DEFAULT_CONFIG = {
  autoQuality: true,
  preferredQuality: 'hd1080',
  forceCodec: true,
  disableAutoplay: false,
  speedControl: true,
  bufferFix: true,
  theaterMode: false,
  skipAds: true
};

// Load cấu hình khi popup mở
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Event listeners cho các buttons
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
});

// Load settings từ storage
function loadSettings() {
  chrome.storage.sync.get('config', (data) => {
    const config = data.config || DEFAULT_CONFIG;
    
    // Set checkboxes
    document.getElementById('autoQuality').checked = config.autoQuality;
    document.getElementById('forceCodec').checked = config.forceCodec;
    document.getElementById('bufferFix').checked = config.bufferFix;
    document.getElementById('speedControl').checked = config.speedControl;
    document.getElementById('skipAds').checked = config.skipAds;
    document.getElementById('theaterMode').checked = config.theaterMode;
    document.getElementById('disableAutoplay').checked = config.disableAutoplay;
    
    // Set select
    document.getElementById('preferredQuality').value = config.preferredQuality;
  });
}

// Save settings
function saveSettings() {
  const config = {
    autoQuality: document.getElementById('autoQuality').checked,
    preferredQuality: document.getElementById('preferredQuality').value,
    forceCodec: document.getElementById('forceCodec').checked,
    disableAutoplay: document.getElementById('disableAutoplay').checked,
    speedControl: document.getElementById('speedControl').checked,
    bufferFix: document.getElementById('bufferFix').checked,
    theaterMode: document.getElementById('theaterMode').checked,
    skipAds: document.getElementById('skipAds').checked
  };
  
  chrome.storage.sync.set({ config }, () => {
    // Show success animation
    const btn = document.getElementById('saveBtn');
    const originalText = btn.textContent;
    
    btn.textContent = '✅ Đã lưu!';
    btn.classList.add('success-animation');
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('success-animation');
    }, 2000);
    
    // Reload tất cả YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
  });
}

// Reset về mặc định
function resetSettings() {
  if (confirm('Bạn có chắc muốn reset về cài đặt mặc định?')) {
    chrome.storage.sync.set({ config: DEFAULT_CONFIG }, () => {
      loadSettings();
      
      const btn = document.getElementById('resetBtn');
      const originalText = btn.textContent;
      
      btn.textContent = '✅ Đã reset!';
      
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  }
}