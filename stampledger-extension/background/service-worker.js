/**
 * StampLedger Verifier — Background Service Worker
 *
 * Handles context menu integration, badge management, and message routing
 * between popup and content scripts.
 */

import { getApiBase, getToken } from '../lib/api.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTEXT_MENU_ID = 'stampledger-verify';
const BADGE_CLEAR_DELAY = 4000; // ms

// ---------------------------------------------------------------------------
// Context menu setup
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Verify with StampLedger',
    contexts: ['link'],
  });
});

// ---------------------------------------------------------------------------
// Context menu click handler
// ---------------------------------------------------------------------------
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  const url = info.linkUrl || '';
  const stampId = extractStampIdFromUrl(url);

  if (!stampId) {
    setBadge('?', '#f39c12', tab?.id);
    showNotification(tab?.id, {
      type: 'info',
      message: 'This link does not appear to be a StampLedger verification URL.',
    });
    return;
  }

  setBadge('...', '#5a6577', tab?.id);

  try {
    const result = await verifyStampDirect(stampId);

    if (result.success) {
      const status = normalizeStatus(result.stamp?.status);
      if (status === 'valid') {
        setBadge('\u2713', '#27ae60', tab?.id);
      } else if (status === 'invalid') {
        setBadge('\u2717', '#e74c3c', tab?.id);
      } else {
        setBadge('?', '#f39c12', tab?.id);
      }

      showNotification(tab?.id, {
        type: 'verification',
        stampId,
        status,
        stamp: result.stamp,
      });
    } else {
      setBadge('\u2717', '#e74c3c', tab?.id);
      showNotification(tab?.id, {
        type: 'error',
        message: result.error || 'Verification failed.',
      });
    }
  } catch (err) {
    setBadge('!', '#e74c3c', tab?.id);
    showNotification(tab?.id, {
      type: 'error',
      message: 'Network error during verification.',
    });
  }
});

// ---------------------------------------------------------------------------
// Message listener (from popup & content scripts)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'verify') {
    verifyStampDirect(message.stampId)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep the message channel open for async response
  }

  if (message.action === 'getSettings') {
    chrome.storage.sync.get(['apiBaseUrl', 'contentScriptEnabled'], (settings) => {
      sendResponse(settings);
    });
    return true;
  }

  if (message.action === 'checkAuth') {
    getToken().then((token) => {
      sendResponse({ authenticated: !!token });
    });
    return true;
  }
});

// ---------------------------------------------------------------------------
// Direct API call (used by service worker without importing full api.js flows)
// ---------------------------------------------------------------------------
async function verifyStampDirect(stampId) {
  try {
    const base = await getApiBase();
    const token = await getToken();

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${base}/api/verify/${encodeURIComponent(stampId)}`,
      { headers }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `Verification failed (${response.status})` };
    }

    return { success: true, stamp: data.stamp || data };
  } catch (err) {
    return { success: false, error: err.message || 'Network error.' };
  }
}

// ---------------------------------------------------------------------------
// Badge management
// ---------------------------------------------------------------------------
let badgeClearTimeout = null;

function setBadge(text, color, tabId) {
  const details = { text };
  if (tabId) details.tabId = tabId;
  chrome.action.setBadgeText(details);

  const colorDetails = { color };
  if (tabId) colorDetails.tabId = tabId;
  chrome.action.setBadgeBackgroundColor(colorDetails);

  // Auto-clear after delay
  if (badgeClearTimeout) clearTimeout(badgeClearTimeout);
  badgeClearTimeout = setTimeout(() => {
    const clearDetails = { text: '' };
    if (tabId) clearDetails.tabId = tabId;
    chrome.action.setBadgeText(clearDetails);
    badgeClearTimeout = null;
  }, BADGE_CLEAR_DELAY);
}

// ---------------------------------------------------------------------------
// Notifications to content script
// ---------------------------------------------------------------------------
function showNotification(tabId, data) {
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, {
    action: 'showNotification',
    data,
  }).catch(() => {
    // Content script may not be injected; ignore silently.
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function extractStampIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/verify\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function normalizeStatus(status) {
  if (!status) return 'pending';
  const s = String(status).toLowerCase();
  if (s === 'active' || s === 'valid' || s === 'verified') return 'valid';
  if (s === 'revoked' || s === 'invalid' || s === 'expired' || s === 'rejected') return 'invalid';
  return 'pending';
}
