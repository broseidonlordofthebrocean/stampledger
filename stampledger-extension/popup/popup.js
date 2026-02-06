/**
 * StampLedger Verifier — Popup Script
 *
 * Handles authentication, stamp verification, and document integrity checks.
 */

import {
  login,
  getMe,
  getToken,
  clearAuth,
  verifyStamp,
  checkIntegrity,
  extractStampId,
} from '../lib/api.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const loadingView = document.getElementById('loading-view');

// Login
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// User
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Verify stamp
const stampInput = document.getElementById('stamp-input');
const verifyBtn = document.getElementById('verify-btn');
const stampResult = document.getElementById('stamp-result');

// Document integrity
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const integrityBtn = document.getElementById('integrity-btn');
const hashDisplay = document.getElementById('hash-display');
const hashValue = document.getElementById('hash-value');
const integrityResult = document.getElementById('integrity-result');

// Recent
const recentList = document.getElementById('recent-list');

// Footer
const openOptions = document.getElementById('open-options');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentHash = null;
let recentVerifications = [];

// ---------------------------------------------------------------------------
// View helpers
// ---------------------------------------------------------------------------
function showView(view) {
  loginView.hidden = true;
  mainView.hidden = true;
  loadingView.hidden = true;
  view.hidden = false;
}

function setButtonLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-loading');
  if (text) text.hidden = loading;
  if (spinner) spinner.hidden = !loading;
  btn.disabled = loading;
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
  el.textContent = '';
}

// ---------------------------------------------------------------------------
// Result rendering
// ---------------------------------------------------------------------------
function renderStampResult(container, result) {
  container.hidden = false;

  if (!result.success) {
    container.className = 'result error';
    container.innerHTML = `
      <div class="result-header">
        <span class="status-dot invalid"></span>
        Verification Failed
      </div>
      <div class="result-detail">${escapeHtml(result.error)}</div>
    `;
    return;
  }

  const stamp = result.stamp || {};
  const status = normalizeStatus(stamp.status);
  const statusLabel = status === 'valid' ? 'Valid' : status === 'invalid' ? 'Invalid / Revoked' : 'Pending';

  container.className = `result ${status}`;
  container.innerHTML = `
    <div class="result-header">
      <span class="status-dot ${status}"></span>
      ${escapeHtml(statusLabel)}
    </div>
    <div class="result-detail">
      ${stamp.stamp_type ? `<strong>Type:</strong> ${escapeHtml(stamp.stamp_type)}<br>` : ''}
      ${stamp.engineer_name ? `<strong>Engineer:</strong> ${escapeHtml(stamp.engineer_name)}<br>` : ''}
      ${stamp.license_number ? `<strong>License:</strong> ${escapeHtml(stamp.license_number)}<br>` : ''}
      ${stamp.project_name ? `<strong>Project:</strong> ${escapeHtml(stamp.project_name)}<br>` : ''}
      ${stamp.stamped_at ? `<strong>Stamped:</strong> ${formatDate(stamp.stamped_at)}` : ''}
    </div>
  `;
}

function renderIntegrityResult(container, result) {
  container.hidden = false;

  if (!result.success) {
    container.className = 'result error';
    container.innerHTML = `
      <div class="result-header">
        <span class="status-dot invalid"></span>
        Integrity Check Failed
      </div>
      <div class="result-detail">${escapeHtml(result.error)}</div>
    `;
    return;
  }

  const doc = result.document || {};
  const matched = doc.matched !== false;
  const status = matched ? 'valid' : 'invalid';

  container.className = `result ${status}`;
  container.innerHTML = `
    <div class="result-header">
      <span class="status-dot ${status}"></span>
      ${matched ? 'Document Integrity Verified' : 'No Matching Document Found'}
    </div>
    <div class="result-detail">
      ${doc.filename ? `<strong>File:</strong> ${escapeHtml(doc.filename)}<br>` : ''}
      ${doc.uploaded_at ? `<strong>Uploaded:</strong> ${formatDate(doc.uploaded_at)}<br>` : ''}
      ${doc.project_name ? `<strong>Project:</strong> ${escapeHtml(doc.project_name)}` : ''}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Recent verifications
// ---------------------------------------------------------------------------
async function loadRecent() {
  try {
    const { recentVerifications: stored } = await chrome.storage.local.get('recentVerifications');
    recentVerifications = stored || [];
  } catch {
    recentVerifications = [];
  }
  renderRecent();
}

async function saveRecent() {
  // Keep only the last 10
  recentVerifications = recentVerifications.slice(0, 10);
  await chrome.storage.local.set({ recentVerifications });
}

function addRecent(id, status) {
  recentVerifications.unshift({
    id,
    status,
    time: Date.now(),
  });
  saveRecent();
  renderRecent();
}

function renderRecent() {
  if (recentVerifications.length === 0) {
    recentList.innerHTML = '<p class="empty-state">No recent verifications.</p>';
    return;
  }

  recentList.innerHTML = recentVerifications
    .map((item) => {
      const s = normalizeStatus(item.status);
      return `
        <div class="recent-item">
          <span class="status-dot ${s}"></span>
          <span class="recent-item-id" title="${escapeHtml(item.id)}">${escapeHtml(item.id)}</span>
          <span class="recent-item-status ${s}">${s}</span>
          <span class="recent-item-time">${timeAgo(item.time)}</span>
        </div>
      `;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function normalizeStatus(status) {
  if (!status) return 'pending';
  const s = String(status).toLowerCase();
  if (s === 'active' || s === 'valid' || s === 'verified') return 'valid';
  if (s === 'revoked' || s === 'invalid' || s === 'expired' || s === 'rejected') return 'invalid';
  return 'pending';
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Compute the SHA-256 hash of a File.
 * @param {File} file
 * @returns {Promise<string>} Hex-encoded hash
 */
async function computeSha256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
async function init() {
  showView(loadingView);

  const token = await getToken();

  if (!token) {
    showView(loginView);
    return;
  }

  // Validate the token
  const meResult = await getMe();

  if (!meResult.success) {
    // Token expired or invalid
    await clearAuth();
    showView(loginView);
    return;
  }

  showUserInfo(meResult.user);
  await loadRecent();
  showView(mainView);
}

function showUserInfo(user) {
  if (!user) return;
  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.email || 'User';
  userName.textContent = displayName;
  userEmail.textContent = user.email || '';
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(loginError);
  setButtonLoading(loginBtn, true);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showError(loginError, 'Please enter both email and password.');
    setButtonLoading(loginBtn, false);
    return;
  }

  const result = await login(email, password);

  if (!result.success) {
    showError(loginError, result.error);
    setButtonLoading(loginBtn, false);
    return;
  }

  showUserInfo(result.user);
  await loadRecent();
  setButtonLoading(loginBtn, false);
  showView(mainView);
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await clearAuth();
  recentVerifications = [];
  loginEmail.value = '';
  loginPassword.value = '';
  hideError(loginError);
  stampResult.hidden = true;
  integrityResult.hidden = true;
  hashDisplay.hidden = true;
  showView(loginView);
});

// Verify stamp
verifyBtn.addEventListener('click', async () => {
  const raw = stampInput.value.trim();
  if (!raw) {
    stampResult.hidden = false;
    stampResult.className = 'result error';
    stampResult.innerHTML = `
      <div class="result-header">
        <span class="status-dot invalid"></span>
        Please enter a stamp ID or URL.
      </div>
    `;
    return;
  }

  const stampId = extractStampId(raw);
  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying...';

  const result = await verifyStamp(stampId);
  renderStampResult(stampResult, result);

  // Track recent
  const status = result.success
    ? normalizeStatus((result.stamp || {}).status)
    : 'invalid';
  addRecent(stampId, status);

  verifyBtn.disabled = false;
  verifyBtn.textContent = 'Verify';
});

// Allow Enter key in stamp input
stampInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    verifyBtn.click();
  }
});

// File picker
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) {
    fileName.textContent = 'No file selected';
    integrityBtn.disabled = true;
    hashDisplay.hidden = true;
    currentHash = null;
    return;
  }

  fileName.textContent = file.name;
  integrityBtn.disabled = true;
  hashDisplay.hidden = true;
  integrityResult.hidden = true;

  try {
    currentHash = await computeSha256(file);
    hashValue.textContent = currentHash;
    hashDisplay.hidden = false;
    integrityBtn.disabled = false;
  } catch (err) {
    fileName.textContent = 'Error reading file';
    currentHash = null;
  }
});

// Check integrity
integrityBtn.addEventListener('click', async () => {
  if (!currentHash) return;

  integrityBtn.disabled = true;
  integrityBtn.textContent = 'Checking...';

  const result = await checkIntegrity(currentHash);
  renderIntegrityResult(integrityResult, result);

  integrityBtn.disabled = false;
  integrityBtn.textContent = 'Check Integrity';
});

// Options link
openOptions.addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
init();
