/**
 * StampLedger Verifier — Options Page Script
 *
 * Manages user-configurable settings stored in chrome.storage.sync.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Defaults
  // ---------------------------------------------------------------------------
  const DEFAULTS = {
    apiBaseUrl: 'https://portal.stampledger.com',
    contentScriptEnabled: true,
  };

  // ---------------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------------
  const form = document.getElementById('options-form');
  const apiUrlInput = document.getElementById('api-url');
  const contentEnabledInput = document.getElementById('content-enabled');
  const resetBtn = document.getElementById('reset-btn');
  const saveStatus = document.getElementById('save-status');

  let statusTimeout = null;

  // ---------------------------------------------------------------------------
  // Load saved settings
  // ---------------------------------------------------------------------------
  function loadSettings() {
    chrome.storage.sync.get(
      ['apiBaseUrl', 'contentScriptEnabled'],
      (settings) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load settings:', chrome.runtime.lastError.message);
          return;
        }

        apiUrlInput.value = settings.apiBaseUrl || DEFAULTS.apiBaseUrl;
        contentEnabledInput.checked =
          settings.contentScriptEnabled !== undefined
            ? settings.contentScriptEnabled
            : DEFAULTS.contentScriptEnabled;
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Save settings
  // ---------------------------------------------------------------------------
  function saveSettings() {
    let apiUrl = apiUrlInput.value.trim();

    // Validate URL
    if (apiUrl) {
      try {
        new URL(apiUrl);
      } catch {
        showStatus('Invalid URL. Please enter a valid endpoint.', true);
        return;
      }
      // Remove trailing slash
      apiUrl = apiUrl.replace(/\/+$/, '');
    } else {
      apiUrl = DEFAULTS.apiBaseUrl;
    }

    const settings = {
      apiBaseUrl: apiUrl,
      contentScriptEnabled: contentEnabledInput.checked,
    };

    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        showStatus('Failed to save: ' + chrome.runtime.lastError.message, true);
        return;
      }
      showStatus('Settings saved.', false);
    });
  }

  // ---------------------------------------------------------------------------
  // Reset to defaults
  // ---------------------------------------------------------------------------
  function resetDefaults() {
    apiUrlInput.value = DEFAULTS.apiBaseUrl;
    contentEnabledInput.checked = DEFAULTS.contentScriptEnabled;
    saveSettings();
  }

  // ---------------------------------------------------------------------------
  // Status message
  // ---------------------------------------------------------------------------
  function showStatus(message, isError) {
    saveStatus.textContent = message;
    saveStatus.style.color = isError ? '#e74c3c' : '#27ae60';
    saveStatus.classList.add('visible');

    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      saveStatus.classList.remove('visible');
    }, 3000);
  }

  // ---------------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });

  resetBtn.addEventListener('click', () => {
    resetDefaults();
  });

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------
  loadSettings();
})();
