/**
 * API Service for Signature Verification Pipeline
 * Connects to the backend comparison endpoint with automatic mock fallback support.
 */
import mockResponseData from '../data/mockResponse.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Compare two signature files using the 6-stage LCS pipeline.
 *
 * @param {File|Blob|string} fileA - Signature A image file
 * @param {File|Blob|string} fileB - Signature B image file
 * @param {Object} params - Pipeline parameters
 * @param {boolean} forceMock - Force mock data mode
 * @returns {Promise<Object>} Verification response payload
 */
export async function compareSignatures(fileA, fileB, params = {}, forceMock = true) {
  const mergedParams = {
    threshold: params.threshold ?? 128,
    block_size: params.block_size ?? 4,
    ink_ratio: params.ink_ratio ?? 0.10,
    quantization_levels: params.quantization_levels ?? 16,
    working_resolution: params.working_resolution ?? 64,
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

  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/api/compare-signatures`, {
      method: 'POST',
      body: formData,
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(
        errorJson.error || `Server responded with status ${response.status} (${response.statusText})`
      );
    }

    const data = await response.json();
    data._meta = {
      source: 'live',
      timestamp: new Date().toISOString(),
      latency_ms: elapsed,
    };
    return data;
  } catch (error) {
    console.warn('API call failed, error:', error.message);
    throw error;
  }
}
