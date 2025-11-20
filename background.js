// Background Service Worker
console.log('YouTube Video Fix Pro - Background Service Worker started');

// Lắng nghe khi extension được cài đặt
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension được cài đặt lần đầu');
    
    // Set cấu hình mặc định
    const defaultConfig = {
      autoQuality: true,
      preferredQuality: 'hd1080',
      forceCodec: true,
      disableAutoplay: false,
      speedControl: true,
      bufferFix: true,
      theaterMode: false,
      skipAds: true
    };
    
    chrome.storage.sync.set({ config: defaultConfig });
    
    // Mở tab chào mừng (optional)
    chrome.tabs.create({
      url: 'https://www.youtube.com'
    });
  }
});

// Optimize video requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Log video requests để debug
    if (details.url.includes('videoplayback')) {
      console.log('Video request:', details.url);
    }
    return { cancel: false };
  },
  { urls: ['*://*.googlevideo.com/*'] },
  []
);

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getConfig') {
    chrome.storage.sync.get('config', (data) => {
      sendResponse(data.config);
    });
    return true; // Async response
  }
  
  if (request.type === 'log') {
    console.log('[Content Script]:', request.message);
  }
});

// Theo dõi tab YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    console.log('YouTube video page loaded:', tab.url);
    
    // Inject content script nếu cần (với try-catch để tránh lỗi)
    if (chrome.scripting && chrome.scripting.executeScript) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).catch(err => {
        console.log('Script injection skipped:', err.message);
      });
    }
  }
});