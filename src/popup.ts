// =====================================================
// POPUP LOGIC (TypeScript)
// =====================================================

import type { SecuritySettings, MessageAction, MessageResponse } from './types';

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  await loadSettings();
  await updateStats();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings(): Promise<void> {
  const settings = await chrome.storage.local.get([
    'isEnabled',
    'trackingEnabled',
    'malwareEnabled',
    'phishingEnabled',
    'httpsEnabled',
    'realtimeEnabled'
  ]) as Partial<SecuritySettings>;

  // Set main toggle
  const mainToggle = getElement<HTMLDivElement>('mainToggle');
  const statusDot = getElement<HTMLDivElement>('statusDot');
  const statusText = getElement<HTMLSpanElement>('statusText');

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
  const features: Array<keyof SecuritySettings> = [
    'trackingEnabled',
    'malwareEnabled',
    'phishingEnabled',
    'httpsEnabled',
    'realtimeEnabled'
  ];

  features.forEach(feature => {
    const featureName = feature.replace('Enabled', '');
    const toggle = document.querySelector<HTMLDivElement>(
      `[data-feature="${featureName}"]`
    );
    if (toggle && settings[feature] !== false) {
      toggle.classList.add('active');
    }
  });
}

// Update statistics
async function updateStats(): Promise<void> {
  const stats = await chrome.storage.local.get([
    'blockedCount',
    'threatCount'
  ]) as Partial<SecuritySettings>;

  const blockedCount = getElement<HTMLDivElement>('blockedCount');
  const threatCount = getElement<HTMLDivElement>('threatCount');

  blockedCount.textContent = (stats.blockedCount || 0).toLocaleString();
  threatCount.textContent = (stats.threatCount || 0).toLocaleString();
}

// Setup event listeners
function setupEventListeners(): void {
  // Main toggle
  const mainToggle = getElement<HTMLDivElement>('mainToggle');
  mainToggle.addEventListener('click', handleMainToggle);

  // Feature toggles
  const featureToggles = document.querySelectorAll<HTMLDivElement>('.feature-toggle');
  featureToggles.forEach(toggle => {
    toggle.addEventListener('click', handleFeatureToggle);
  });

  // Scan button
  const scanBtn = getElement<HTMLButtonElement>('scanBtn');
  scanBtn.addEventListener('click', handleScan);
}

// Main toggle handler
async function handleMainToggle(e: Event): Promise<void> {
  const toggle = e.currentTarget as HTMLDivElement;
  const isActive = toggle.classList.contains('active');

  toggle.classList.toggle('active');

  const statusDot = getElement<HTMLDivElement>('statusDot');
  const statusText = getElement<HTMLSpanElement>('statusText');

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
  const message: MessageAction = {
    action: 'toggleProtection',
    enabled: !isActive
  };
  await chrome.runtime.sendMessage(message);
}

// Feature toggle handler
async function handleFeatureToggle(e: Event): Promise<void> {
  const toggle = e.currentTarget as HTMLDivElement;
  const feature = toggle.dataset.feature;
  if (!feature) return;

  const isActive = toggle.classList.contains('active');
  toggle.classList.toggle('active');

  await chrome.storage.local.set({
    [`${feature}Enabled`]: !isActive
  });

  // Notify background script
  const message: MessageAction = {
    action: 'toggleFeature',
    feature,
    enabled: !isActive
  };
  await chrome.runtime.sendMessage(message);
}

// Scan button handler
async function handleScan(): Promise<void> {
  const btn = getElement<HTMLButtonElement>('scanBtn');
  btn.textContent = '⏳ Đang Quét...';
  btn.disabled = true;

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id || !tab.url) {
      throw new Error('Cannot get current tab');
    }

    // Send scan request
    const message: MessageAction = {
      action: 'scanPage',
      tabId: tab.id,
      url: tab.url
    };

    const response = await chrome.runtime.sendMessage(message) as MessageResponse;

    if (response && response.success) {
      btn.textContent = '✅ Hoàn Tất!';
      setTimeout(() => {
        btn.textContent = '🔍 Quét Trang Hiện Tại';
        btn.disabled = false;
      }, 2000);

      // Update stats
      await updateStats();
    } else {
      throw new Error('Scan failed');
    }
  } catch (error) {
    console.error('Scan error:', error);
    btn.textContent = '❌ Lỗi';
    setTimeout(() => {
      btn.textContent = '🔍 Quét Trang Hiện Tại';
      btn.disabled = false;
    }, 2000);
  }
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((message: MessageAction): void => {
  if (message.action === 'updateStats') {
    updateStats();
  }
});

// Helper function to get element with type safety
function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id '${id}' not found`);
  }
  return element as T;
}