import { TabInfo, TabStats, Settings, BrowserHealthReport, ExtensionMessage } from '../shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';
import { calculateHealthReport } from '../utils/healthEngine';

// Global background state
let settings: Settings = { ...DEFAULT_SETTINGS };
const tabStatsMap = new Map<number, TabStats>();
const tabLastActiveMap = new Map<number, number>(); // tabId -> timestamp last active
let lastNotificationTime = 0;
let healthScoreHistory: { timestamp: number; score: number }[] = [];

// Initialize Extension Settings and History
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Browser Doctor AI Service Worker Installed.');
  await loadSettings();
  await loadHistory();
  
  // Set default active timestamps for existing tabs
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  tabs.forEach(tab => {
    if (tab.id !== undefined) {
      tabLastActiveMap.set(tab.id, tab.active ? now : now - 1000 * 60 * 10); // Assume inactive tabs have been inactive for at least 10 minutes
    }
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await loadSettings();
  if (settings.launchDashboardOnStartup) {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

// Load settings from Chrome Storage
async function loadSettings() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
  if (result[STORAGE_KEYS.SETTINGS]) {
    settings = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  } else {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }
}

// Load health history
async function loadHistory() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.HEALTH_HISTORY]);
  if (result[STORAGE_KEYS.HEALTH_HISTORY]) {
    healthScoreHistory = result[STORAGE_KEYS.HEALTH_HISTORY];
  }
}

// Update health history
async function saveHealthHistory(score: number) {
  const now = Date.now();
  // Only add history if it's been at least 10 minutes since the last entry, or if history is empty
  const lastEntry = healthScoreHistory[healthScoreHistory.length - 1];
  if (!lastEntry || now - lastEntry.timestamp > 1000 * 60 * 10 || Math.abs(lastEntry.score - score) > 5) {
    healthScoreHistory.push({ timestamp: now, score });
    // Limit to 30 items
    if (healthScoreHistory.length > 30) {
      healthScoreHistory.shift();
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.HEALTH_HISTORY]: healthScoreHistory });
  }
}

// Keep track of active tabs to know inactive duration
chrome.tabs.onActivated.addListener((activeInfo) => {
  const now = Date.now();
  // Mark the newly activated tab's active timestamp as now
  tabLastActiveMap.set(activeInfo.tabId, now);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStatsMap.delete(tabId);
  tabLastActiveMap.delete(tabId);
});

// Periodically clean up closed/invalid tab states
async function cleanTabState() {
  const tabs = await chrome.tabs.query({});
  const tabIds = new Set(tabs.map(t => t.id).filter(id => id !== undefined) as number[]);
  
  // Clean up stats map
  for (const tabId of tabStatsMap.keys()) {
    if (!tabIds.has(tabId)) {
      tabStatsMap.delete(tabId);
    }
  }

  // Clean up activation timestamps
  for (const tabId of tabLastActiveMap.keys()) {
    if (!tabIds.has(tabId)) {
      tabLastActiveMap.delete(tabId);
    }
  }
}

// Compile stats from chrome.tabs.query & stored metrics from Content Scripts
async function getTabList(): Promise<TabInfo[]> {
  await cleanTabState();
  const tabs = await chrome.tabs.query({});
  const now = Date.now();

  return tabs.map(tab => {
    const tabId = tab.id || 0;
    const stats = tabStatsMap.get(tabId);
    const lastActive = tabLastActiveMap.get(tabId) || now;

    // Calculate how long it has been inactive
    const inactiveDurationMs = tab.active ? 0 : now - lastActive;

    return {
      id: tabId,
      url: tab.url || '',
      title: tab.title || '',
      favIconUrl: tab.favIconUrl,
      active: tab.active,
      lastActive,
      stats,
      resourceTier: 'Light', // will be computed in engine
      isDuplicate: false,    // will be computed in engine
      inactiveDurationMs,
    };
  });
}

// Trigger browser notifications
function triggerNotification(title: string, message: string) {
  if (!settings.notificationsEnabled) return;
  const now = Date.now();
  // Minimum 15-minute gap between notifications to prevent spam
  if (now - lastNotificationTime < 15 * 60 * 1000) return;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png',
    title: title,
    message: message,
    priority: 1,
  });
  lastNotificationTime = now;
}

// Core health monitor runner
async function runHealthCheck(): Promise<BrowserHealthReport> {
  const tabs = await getTabList();
  const report = calculateHealthReport(tabs);

  // Save history
  await saveHealthHistory(report.score);

  // Trigger alert if score drops below threshold
  if (report.score < settings.healthThreshold) {
    triggerNotification(
      'Browser Health Alert',
      `Your browser health score has dropped to ${report.score}/100. Try optimizing tab memory.`
    );
  }

  // Also trigger if there are exceptionally heavy tabs
  const heavyCount = report.heavyTabsCount;
  if (heavyCount >= 3) {
    triggerNotification(
      'Heavy Resource Usage',
      `Detected ${heavyCount} heavy tabs consuming high memory. Open Dashboard to inspect.`
    );
  }

  return report;
}

// Message handlers
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  const action = message.action;
  const payload = message.payload;

  if (action === 'report_stats' && sender.tab && sender.tab.id) {
    // Content script is reporting page load/activity metrics
    tabStatsMap.set(sender.tab.id, payload as TabStats);
    sendResponse({ success: true });
    return false; // synchronous response
  }

  // Handle dashboard/extension action requests
  if (action === 'get_health_report') {
    runHealthCheck().then(report => {
      sendResponse({ report, settings });
    });
    return true; // asynchronous response
  }

  if (action === 'get_settings') {
    loadSettings().then(() => {
      sendResponse({ settings });
    });
    return true;
  }

  if (action === 'save_settings') {
    settings = { ...settings, ...payload };
    chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings }).then(() => {
      // Notify all tabs that settings changed (so content scripts update positions/visibility)
      chrome.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'settings_updated', payload: settings }).catch(() => {
              // Ignore errors for tabs where content script isn't active
            });
          }
        });
      });
      sendResponse({ success: true, settings });
    });
    return true;
  }

  if (action === 'get_history') {
    chrome.storage.local.get([STORAGE_KEYS.HEALTH_HISTORY]).then(result => {
      sendResponse({ history: result[STORAGE_KEYS.HEALTH_HISTORY] || [] });
    });
    return true;
  }

  if (action === 'open_dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    sendResponse({ success: true });
    return false;
  }

  // Optimization triggers
  if (action === 'close_tab' && payload && payload.tabId) {
    chrome.tabs.remove(payload.tabId).then(() => {
      runHealthCheck().then(report => {
        sendResponse({ success: true, report });
      });
    });
    return true;
  }

  if (action === 'close_duplicates') {
    getTabList().then(tabs => {
      const urlCounts: { [key: string]: number } = {};
      const tabsToRemove: number[] = [];

      tabs.forEach(tab => {
        if (!tab.url) return;
        const cleanUrl = tab.url.split('#')[0];
        urlCounts[cleanUrl] = (urlCounts[cleanUrl] || 0) + 1;
        // If we have seen it before, close it!
        if (urlCounts[cleanUrl] > 1) {
          tabsToRemove.push(tab.id);
        }
      });

      if (tabsToRemove.length > 0) {
        chrome.tabs.remove(tabsToRemove).then(() => {
          runHealthCheck().then(report => {
            triggerNotification('Duplicates Cleaned', `Successfully closed ${tabsToRemove.length} duplicate tab(s).`);
            sendResponse({ success: true, report });
          });
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (action === 'suspend_inactive') {
    getTabList().then(tabs => {
      const fifteenMinutes = 15 * 60 * 1000;
      let suspendCount = 0;
      const suspendPromises = tabs.map(tab => {
        if (!tab.active && tab.inactiveDurationMs > fifteenMinutes) {
          suspendCount++;
          return chrome.tabs.discard(tab.id).catch(err => {
            console.warn(`Failed to discard tab ${tab.id}:`, err);
          });
        }
        return Promise.resolve();
      });

      Promise.all(suspendPromises).then(() => {
        runHealthCheck().then(report => {
          if (suspendCount > 0) {
            triggerNotification('Tabs Suspended', `Suspended ${suspendCount} inactive tab(s) to reclaim memory.`);
          }
          sendResponse({ success: true, report });
        });
      });
    });
    return true;
  }

  return false;
});
