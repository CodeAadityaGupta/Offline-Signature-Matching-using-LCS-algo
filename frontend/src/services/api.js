/**
 * API Service for Signature Verification Pipeline
 * Connects to the backend comparison endpoint with automatic mock fallback support.
 */
import mockResponseData from '../data/mockResponse.json';

export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Check connectivity/health of the live backend server.
 *
 * @param {string} baseUrl - Backend API root URL
 * @returns {Promise<{ isHealthy: boolean, status: string, latencyMs?: number }>}
 */
export async function checkBackendHealth(baseUrl = DEFAULT_API_BASE_URL) {
  const t0 = performance.now();
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Try health check route or root status
    const response = await fetch(`${cleanUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() =>
      fetch(`${cleanUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      })
    );

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - t0);

    if (response && response.ok) {
      return { isHealthy: true, status: 'Online', latencyMs };
    }
    return { isHealthy: false, status: `HTTP ${response?.status || 'Unknown'}`, latencyMs };
  } catch (err) {
    return {
      isHealthy: false,
      status: err.name === 'AbortError' ? 'Connection Timeout' : 'Offline / Unreachable',
    };
  }
}

/**
 * Compare two signature files using the 6-stage LCS pipeline.
 *
 * @param {File|Blob|string} fileA - Signature A image file
 * @param {File|Blob|string} fileB - Signature B image file
 * @param {Object} params - Pipeline parameters
 * @param {boolean} forceMock - Force mock data mode
 * @param {string} customBaseUrl - Optional custom backend base URL
 * @returns {Promise<Object>} Verification response payload
 */
export async function compareSignatures(
  fileA,
  fileB,
  params = {},
  forceMock = true,
  customBaseUrl = DEFAULT_API_BASE_URL
) {
  const mergedParams = {
    threshold: params.threshold ?? 128,
    block_size: params.block_size ?? 4,
    ink_ratio: params.ink_ratio ?? 0.10,
    quantization_levels: params.quantization_levels ?? 16,
    working_resolution: params.working_resolution ?? 64,
    match_threshold_pct: params.match_threshold_pct ?? 60,
  };

  // If forceMock is enabled, return the mocked pipeline payload
  if (forceMock) {
    // Simulate slight processing latency (350ms) for realistic UX feel
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Deep clone mock data and update params_used to reflect active input
    const response = JSON.parse(JSON.stringify(mockResponseData));
    response.params_used = mergedParams;
    response._meta = {
      source: 'mock',
      timestamp: new Date().toISOString(),
      latency_ms: 350,
    };
    return response;
  }

  // Real backend call via multipart/form-data
  const formData = new FormData();
  if (fileA instanceof File || fileA instanceof Blob) {
    formData.append('signature_a', fileA);
  }
  if (fileB instanceof File || fileB instanceof Blob) {
    formData.append('signature_b', fileB);
  }

  Object.entries(mergedParams).forEach(([key, val]) => {
    formData.append(key, val);
  });

  const cleanBaseUrl = (customBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${cleanBaseUrl}/api/compare-signatures`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(
        errorJson.error ||
          errorJson.detail ||
          `Backend server error (HTTP ${response.status}: ${response.statusText})`
      );
    }

    const data = await response.json();
    data._meta = {
      source: 'live',
      timestamp: new Date().toISOString(),
      latency_ms: elapsed,
      endpoint: cleanBaseUrl,
    };
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out while contacting live backend at ${cleanBaseUrl}`);
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error(
        `Unable to reach backend at ${cleanBaseUrl}. Make sure the backend server is running, or toggle to 'Mock Data Mode' in the top header.`
      );
    }
    throw error;
  }
}
