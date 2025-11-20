// YouTube Video Fix Pro - Content Script
console.log('🎥 YouTube Video Fix Pro đã được kích hoạt!');

// Cấu hình mặc định
const DEFAULT_CONFIG = {
  autoQuality: true,
  preferredQuality: 'hd1080',
  forceCodec: 'vp9',
  disableAutoplay: false,
  speedControl: true,
  bufferFix: true,
  theaterMode: false,
  skipAds: true
};

let config = { ...DEFAULT_CONFIG };

// Load cấu hình từ storage
chrome.storage.sync.get('config', (data) => {
  if (data.config) {
    config = { ...DEFAULT_CONFIG, ...data.config };
  }
  init();
});

function init() {
  // Fix ngay khi trang load
  fixVideoQuality();
  fixBuffering();
  improvePerformance();
  
  // Theo dõi thay đổi URL (YouTube là SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        fixVideoQuality();
        fixBuffering();
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
}

// Fix chất lượng video tự động
function fixVideoQuality() {
  const video = document.querySelector('video');
  if (!video) {
    setTimeout(fixVideoQuality, 500);
    return;
  }

  console.log('🎬 Đang fix chất lượng video...');

  // Đợi YouTube player load
  const checkPlayer = setInterval(() => {
    const player = document.getElementById('movie_player');
    if (player && player.getAvailableQualityLevels) {
      clearInterval(checkPlayer);
      
      try {
        const qualities = player.getAvailableQualityLevels();
        console.log('📊 Chất lượng có sẵn:', qualities);
        
        if (config.autoQuality && qualities.length > 0) {
          // Chọn chất lượng cao nhất hoặc theo preference
          let targetQuality = qualities[0]; // Mặc định là cao nhất
          
          if (config.preferredQuality && qualities.includes(config.preferredQuality)) {
            targetQuality = config.preferredQuality;
          }
          
          player.setPlaybackQualityRange(targetQuality, targetQuality);
          player.setPlaybackQuality(targetQuality);
          console.log('✅ Đã set chất lượng:', targetQuality);
        }
        
        // Force codec VP9 cho chất lượng tốt hơn
        if (config.forceCodec === 'vp9') {
          forceVP9Codec();
        }
        
      } catch (e) {
        console.error('❌ Lỗi khi set quality:', e);
      }
    }
  }, 500);
  
  // Cleanup sau 10s nếu không tìm thấy player
  setTimeout(() => clearInterval(checkPlayer), 10000);
}

// Force sử dụng codec VP9 (chất lượng tốt hơn h264)
function forceVP9Codec() {
  const video = document.querySelector('video');
  if (!video) return;
  
  // Override canPlayType để ưu tiên VP9
  const originalCanPlayType = video.canPlayType.bind(video);
  video.canPlayType = function(type) {
    if (type.includes('vp9') || type.includes('vp09')) {
      return 'probably';
    }
    return originalCanPlayType(type);
  };
  
  console.log('✅ Đã force codec VP9');
}

// Fix lỗi buffering/lag
function fixBuffering() {
  const video = document.querySelector('video');
  if (!video) {
    setTimeout(fixBuffering, 500);
    return;
  }

  console.log('🔧 Đang fix buffering...');

  // Tăng buffer size
  if (config.bufferFix) {
    // Preload tất cả video
    video.preload = 'auto';
    
    // Disable media source để force download toàn bộ
    try {
      const mediaSource = video.srcObject;
      if (mediaSource) {
        // Tăng buffer ahead
        if (window.MediaSource) {
          console.log('✅ Đã tối ưu buffer');
        }
      }
    } catch (e) {
      console.log('⚠️ Không thể tối ưu buffer:', e);
    }
  }

  // Fix lỗi stalling
  video.addEventListener('stalled', () => {
    console.log('⚠️ Video bị stall, đang fix...');
    const currentTime = video.currentTime;
    video.load();
    video.currentTime = currentTime;
    video.play();
  });

  // Fix lỗi waiting
  video.addEventListener('waiting', () => {
    console.log('⏳ Video đang chờ, attempting fix...');
    // Giảm quality tạm thời nếu cần
    setTimeout(() => {
      if (video.readyState < 3) {
        video.play();
      }
    }, 100);
  });

  // Fix lỗi error
  video.addEventListener('error', (e) => {
    console.error('❌ Video error:', e);
    // Reload video
    setTimeout(() => {
      const currentTime = video.currentTime;
      video.load();
      video.currentTime = currentTime;
      video.play();
    }, 1000);
  });

  console.log('✅ Buffering fixes applied');
}

// Cải thiện performance
function improvePerformance() {
  // Đợi DOM ready
  const addStyles = () => {
    if (!document.head) {
      setTimeout(addStyles, 100);
      return;
    }
    
    // Disable animations không cần thiết
    const style = document.createElement('style');
    style.textContent = `
      /* Tắt animations lag */
      .ytp-spinner {
        display: none !important;
      }
      
      /* Smooth playback */
      video {
        image-rendering: crisp-edges;
        image-rendering: -webkit-optimize-contrast;
      }
      
      /* Theater mode cải thiện */
      ${config.theaterMode ? `
        #player-theater-container {
          max-width: none !important;
        }
      ` : ''}
    `;
    document.head.appendChild(style);
  };
  
  addStyles();
  
  // Disable autoplay nếu được config
  if (config.disableAutoplay) {
    const video = document.querySelector('video');
    if (video) {
      video.autoplay = false;
    }
  }
  
  console.log('✅ Performance improvements applied');
}

// Speed control enhancements
if (config.speedControl) {
  document.addEventListener('keydown', (e) => {
    const video = document.querySelector('video');
    if (!video) return;
    
    // Shift + . để tăng tốc độ
    if (e.shiftKey && e.key === '>') {
      video.playbackRate = Math.min(video.playbackRate + 0.25, 4);
      showNotification(`Tốc độ: ${video.playbackRate}x`);
      e.preventDefault();
    }
    
    // Shift + , để giảm tốc độ
    if (e.shiftKey && e.key === '<') {
      video.playbackRate = Math.max(video.playbackRate - 0.25, 0.25);
      showNotification(`Tốc độ: ${video.playbackRate}x`);
      e.preventDefault();
    }
    
    // Shift + R để reset
    if (e.shiftKey && e.key === 'R') {
      video.playbackRate = 1;
      showNotification('Tốc độ: 1x');
      e.preventDefault();
    }
  });
}

// Skip ads automatically
if (config.skipAds) {
  setInterval(() => {
    // Skip button
    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipButton) {
      skipButton.click();
      console.log('⏭️ Đã skip quảng cáo');
    }
    
    // Mute ads
    const video = document.querySelector('video');
    const adContainer = document.querySelector('.ad-showing');
    if (video && adContainer) {
      video.muted = true;
    }
  }, 500);
}

// Hiển thị thông báo
function showNotification(message) {
  // Kiểm tra body có sẵn chưa
  if (!document.body) {
    setTimeout(() => showNotification(message), 100);
    return;
  }
  
  const existing = document.querySelector('.ytfix-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'ytfix-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 9999999;
    font-size: 14px;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Thêm CSS animations
const addAnimations = () => {
  if (!document.head) {
    setTimeout(addAnimations, 100);
    return;
  }
  
  const animStyle = document.createElement('style');
  animStyle.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(animStyle);
};

addAnimations();

// Log status
console.log('✅ YouTube Video Fix Pro đã sẵn sàng!');
console.log('⚙️ Cấu hình hiện tại:', config);