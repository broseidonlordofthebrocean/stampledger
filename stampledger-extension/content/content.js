/**
 * StampLedger Verifier — Content Script
 *
 * Scans the page for StampLedger verification links and adds inline
 * verification badges. Self-contained (no ES module imports).
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  const VERIFY_URL_PATTERN = /stampledger\.com\/verify\/([a-zA-Z0-9_-]+)/;
  const BADGE_CLASS = 'stampledger-verify-badge';
  const TOOLTIP_CLASS = 'stampledger-tooltip';
  const PROCESSED_ATTR = 'data-stampledger-processed';
  const SCAN_DEBOUNCE_MS = 500;

  // ---------------------------------------------------------------------------
  // Styles (injected once)
  // ---------------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('stampledger-content-styles')) return;

    const style = document.createElement('style');
    style.id = 'stampledger-content-styles';
    style.textContent = `
      .${BADGE_CLASS} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        margin-left: 4px;
        border-radius: 50%;
        background: #dfe3e8;
        color: #5a6577;
        font-size: 10px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, transform 0.15s;
        vertical-align: middle;
        line-height: 1;
        border: none;
        padding: 0;
        text-decoration: none;
        position: relative;
      }

      .${BADGE_CLASS}:hover {
        transform: scale(1.15);
      }

      .${BADGE_CLASS}.loading {
        background: #dfe3e8;
        color: #5a6577;
      }

      .${BADGE_CLASS}.valid {
        background: #27ae60;
        color: #ffffff;
      }

      .${BADGE_CLASS}.invalid {
        background: #e74c3c;
        color: #ffffff;
      }

      .${BADGE_CLASS}.pending {
        background: #f39c12;
        color: #ffffff;
      }

      .${BADGE_CLASS}.error {
        background: #e74c3c;
        color: #ffffff;
      }

      .${TOOLTIP_CLASS} {
        position: fixed;
        z-index: 2147483647;
        max-width: 320px;
        padding: 10px 14px;
        background: #1a3a52;
        color: #ffffff;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.5;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .${TOOLTIP_CLASS}.visible {
        opacity: 1;
      }

      .${TOOLTIP_CLASS} .tooltip-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .${TOOLTIP_CLASS} .tooltip-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .${TOOLTIP_CLASS} .tooltip-dot.valid { background: #27ae60; }
      .${TOOLTIP_CLASS} .tooltip-dot.invalid { background: #e74c3c; }
      .${TOOLTIP_CLASS} .tooltip-dot.pending { background: #f39c12; }

      .${TOOLTIP_CLASS} .tooltip-detail {
        font-size: 11px;
        opacity: 0.85;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // Tooltip management
  // ---------------------------------------------------------------------------
  let tooltipEl = null;

  function getTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = TOOLTIP_CLASS;
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(badge, html) {
    const tip = getTooltip();
    tip.innerHTML = html;

    const rect = badge.getBoundingClientRect();
    tip.style.left = `${rect.left + rect.width / 2}px`;
    tip.style.top = `${rect.bottom + 6}px`;
    tip.style.transform = 'translateX(-50%)';
    tip.classList.add('visible');
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.classList.remove('visible');
    }
  }

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------
  function normalizeStatus(status) {
    if (!status) return 'pending';
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'valid' || s === 'verified') return 'valid';
    if (s === 'revoked' || s === 'invalid' || s === 'expired' || s === 'rejected') return 'invalid';
    return 'pending';
  }

  function statusSymbol(status) {
    if (status === 'valid') return '\u2713';
    if (status === 'invalid') return '\u2717';
    return '?';
  }

  function statusLabel(status) {
    if (status === 'valid') return 'Valid';
    if (status === 'invalid') return 'Invalid / Revoked';
    return 'Pending';
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Verification via background service worker
  // ---------------------------------------------------------------------------
  function verifyViaBackground(stampId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'verify', stampId },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response.' });
          }
        }
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Badge creation & click handler
  // ---------------------------------------------------------------------------
  function createBadge(link, stampId) {
    const badge = document.createElement('span');
    badge.className = `${BADGE_CLASS}`;
    badge.textContent = '\u2713';
    badge.title = 'Click to verify with StampLedger';

    badge.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Already verified? Just show tooltip again
      if (badge.dataset.verified) {
        showCachedTooltip(badge);
        return;
      }

      badge.className = `${BADGE_CLASS} loading`;
      badge.textContent = '\u2026';

      const result = await verifyViaBackground(stampId);

      if (result.success) {
        const stamp = result.stamp || {};
        const status = normalizeStatus(stamp.status);
        badge.className = `${BADGE_CLASS} ${status}`;
        badge.textContent = statusSymbol(status);
        badge.dataset.verified = 'true';
        badge.dataset.status = status;
        badge.dataset.stampData = JSON.stringify(stamp);

        showStampTooltip(badge, status, stamp);
      } else {
        badge.className = `${BADGE_CLASS} error`;
        badge.textContent = '!';
        badge.dataset.verified = 'true';
        badge.dataset.status = 'error';
        badge.dataset.errorMsg = result.error || 'Verification failed.';

        showErrorTooltip(badge, result.error);
      }

      // Hide tooltip after a few seconds
      setTimeout(hideTooltip, 5000);
    });

    // Hover to show cached result
    badge.addEventListener('mouseenter', () => {
      if (badge.dataset.verified) {
        showCachedTooltip(badge);
      }
    });

    badge.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    // Insert the badge after the link
    link.parentNode.insertBefore(badge, link.nextSibling);
  }

  function showStampTooltip(badge, status, stamp) {
    const html = `
      <div class="tooltip-header">
        <span class="tooltip-dot ${status}"></span>
        ${escapeHtml(statusLabel(status))}
      </div>
      <div class="tooltip-detail">
        ${stamp.stamp_type ? `Type: ${escapeHtml(stamp.stamp_type)}<br>` : ''}
        ${stamp.engineer_name ? `Engineer: ${escapeHtml(stamp.engineer_name)}<br>` : ''}
        ${stamp.license_number ? `License: ${escapeHtml(stamp.license_number)}<br>` : ''}
        ${stamp.project_name ? `Project: ${escapeHtml(stamp.project_name)}` : ''}
      </div>
    `;
    showTooltip(badge, html);
  }

  function showErrorTooltip(badge, errorMsg) {
    const html = `
      <div class="tooltip-header">
        <span class="tooltip-dot invalid"></span>
        Verification Failed
      </div>
      <div class="tooltip-detail">${escapeHtml(errorMsg)}</div>
    `;
    showTooltip(badge, html);
  }

  function showCachedTooltip(badge) {
    if (badge.dataset.status === 'error') {
      showErrorTooltip(badge, badge.dataset.errorMsg);
      return;
    }

    try {
      const stamp = JSON.parse(badge.dataset.stampData || '{}');
      showStampTooltip(badge, badge.dataset.status, stamp);
    } catch {
      // No data to show
    }
  }

  // ---------------------------------------------------------------------------
  // Page scanning
  // ---------------------------------------------------------------------------
  function scanPage() {
    const links = document.querySelectorAll(`a[href]:not([${PROCESSED_ATTR}])`);

    links.forEach((link) => {
      const href = link.href || link.getAttribute('href') || '';
      const match = href.match(VERIFY_URL_PATTERN);

      if (match) {
        link.setAttribute(PROCESSED_ATTR, 'true');
        const stampId = match[1];
        createBadge(link, stampId);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Check if content script is enabled
  // ---------------------------------------------------------------------------
  function checkEnabled(callback) {
    try {
      chrome.storage.sync.get('contentScriptEnabled', (settings) => {
        // Default to enabled if not set
        const enabled = settings.contentScriptEnabled !== false;
        callback(enabled);
      });
    } catch {
      callback(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Listen for messages from background
  // ---------------------------------------------------------------------------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showNotification' && message.data) {
      const data = message.data;

      if (data.type === 'verification' && data.stamp) {
        // Could show a toast; for now do nothing disruptive.
      }

      if (data.type === 'error' || data.type === 'info') {
        // Could show a toast; for now do nothing disruptive.
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  checkEnabled((enabled) => {
    if (!enabled) return;

    injectStyles();

    // Initial scan
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanPage);
    } else {
      scanPage();
    }

    // Observe DOM changes for dynamically added links
    let scanTimeout = null;
    const observer = new MutationObserver(() => {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(scanPage, SCAN_DEBOUNCE_MS);
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
})();
