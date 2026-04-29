import { addLog, getAllLogs, deleteLogs } from './lib/indexedDB.js';

const API_URL = 'http://localhost:5000/api';

// Idle detection configuration
chrome.idle.setDetectionInterval(300); // 5 minutes

// Lock the browser on idle or startup
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'locked' || newState === 'idle') {
    lockBrowser();
  }
});

function lockBrowser() {
  chrome.storage.local.remove('token', () => {
    // Notify all tabs to reload or recheck auth
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'checkAuth' }).catch(() => {});
      });
    });
  });
}

// Activity Monitoring implementation
function logEvent(actionType, url, tabId) {
  // Only log if authorized (optional, but requested behavior is monitor when using browser)
  chrome.storage.local.get(['token'], (result) => {
    if (result.token && !url.startsWith('chrome-extension://')) {
        // Simple client side flagging
        const flagged = url.includes('blacklist') || url.includes('malicious');
        const logData = {
          url: url,
          timestamp: new Date().toISOString(),
          tabId: tabId,
          actionType: actionType,
          flagged: flagged
        };
        addLog(logData).catch(err => console.error("Error adding log", err));
    }
  });
}

// 1. Visited URLs / Navigation
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    logEvent('NAVIGATION', details.url, details.tabId);
  }
});

// 2. Tab switching
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if(tab && tab.url) {
      logEvent('TAB_SWITCH', tab.url, activeInfo.tabId);
    }
  });
});

// Periodic Sync Implementation using Alarms
chrome.alarms.create('syncLogs', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncLogs') {
    await syncLogsToBackend();
  }
});

async function syncLogsToBackend() {
  const { token } = await chrome.storage.local.get(['token']);
  if (!token) return;

  const logs = await getAllLogs();
  if (logs.length === 0) return;

  try {
    const response = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(logs)
    });

    if (response.ok) {
      const idsToDelete = logs.map(l => l.id);
      await deleteLogs(idsToDelete);
    }
  } catch (error) {
    console.error('Failed to sync logs:', error);
  }
}
