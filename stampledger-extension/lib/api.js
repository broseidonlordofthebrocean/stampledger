/**
 * StampLedger API Client
 * Shared module for communicating with the StampLedger portal API.
 */

const DEFAULT_API_BASE = 'https://portal.stampledger.com';

/**
 * Retrieve the configured API base URL from storage, falling back to the default.
 * @returns {Promise<string>}
 */
export async function getApiBase() {
  try {
    const { apiBaseUrl } = await chrome.storage.sync.get('apiBaseUrl');
    return apiBaseUrl || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

/**
 * Retrieve the stored auth token.
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    return authToken || null;
  } catch {
    return null;
  }
}

/**
 * Store the auth token.
 * @param {string} token
 */
export async function setToken(token) {
  await chrome.storage.local.set({ authToken: token });
}

/**
 * Clear the stored auth token and user data.
 */
export async function clearAuth() {
  await chrome.storage.local.remove(['authToken', 'userData']);
}

/**
 * Make an authenticated request to the StampLedger API.
 * @param {string} path  - API path (e.g. '/api/auth/login')
 * @param {object} options - fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(path, options = {}) {
  const base = await getApiBase();
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${base}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Log in to StampLedger and store the auth token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, error?: string, user?: object}>}
 */
export async function login(email, password) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Login failed (${response.status})`,
      };
    }

    if (data.token) {
      await setToken(data.token);
    }

    if (data.user) {
      await chrome.storage.local.set({ userData: data.user });
    }

    return { success: true, user: data.user };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error. Check your connection.',
    };
  }
}

/**
 * Get the current authenticated user's profile.
 * @param {string} [token] - Optional token override; otherwise reads from storage.
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function getMe(token) {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiRequest('/api/auth/me', { headers });
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to fetch user (${response.status})`,
      };
    }

    return { success: true, user: data.user || data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error.',
    };
  }
}

/**
 * Verify an engineering stamp by its ID.
 * @param {string} stampId
 * @returns {Promise<{success: boolean, stamp?: object, error?: string}>}
 */
export async function verifyStamp(stampId) {
  try {
    const response = await apiRequest(`/api/verify/${encodeURIComponent(stampId)}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Verification failed (${response.status})`,
      };
    }

    return { success: true, stamp: data.stamp || data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error during verification.',
    };
  }
}

/**
 * Check document integrity by SHA-256 hash.
 * @param {string} sha256Hash - Hex-encoded SHA-256 hash of the document.
 * @returns {Promise<{success: boolean, document?: object, error?: string}>}
 */
export async function checkIntegrity(sha256Hash) {
  try {
    const response = await apiRequest('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ sha256_hash: sha256Hash, action: 'verify_integrity' }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Integrity check failed (${response.status})`,
      };
    }

    return { success: true, document: data.document || data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error during integrity check.',
    };
  }
}

/**
 * Extract a stamp ID from a StampLedger URL or raw ID string.
 * Supports formats:
 *   - https://portal.stampledger.com/verify/abc123
 *   - /verify/abc123
 *   - abc123
 * @param {string} input
 * @returns {string} The extracted stamp ID
 */
export function extractStampId(input) {
  if (!input) return '';

  const trimmed = input.trim();

  // Match /verify/<id> in a URL or path
  const verifyMatch = trimmed.match(/\/verify\/([a-zA-Z0-9_-]+)/);
  if (verifyMatch) {
    return verifyMatch[1];
  }

  // Otherwise treat the whole input as an ID
  return trimmed;
}
