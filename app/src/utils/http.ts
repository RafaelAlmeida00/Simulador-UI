import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getRuntimeEnv } from './runtimeEnv';

/**
 * Enhanced HTTP client with performance optimizations:
 * - Request deduplication for concurrent identical GET requests
 * - Exponential backoff retry for failed requests
 * - Timeout configuration
 * - Centralized error handling
 */

// Request deduplication: cache for pending GET requests
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

/**
 * Generate a unique key for a request based on method, URL, and params.
 */
function getRequestKey(config: InternalAxiosRequestConfig): string {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase()}:${config.url}:${params}`;
}

/**
 * Extended config type to track retry attempts
 */
interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __requestKey?: string;
}

// Create axios instance with base configuration
export const http = axios.create({
  baseURL: getRuntimeEnv().apiBaseUrl || undefined,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Deduplication for GET requests
 * If an identical GET request is already in flight, return the same promise
 */
http.interceptors.request.use(
  (config: RetryConfig) => {
    // Only deduplicate GET requests
    if (config.method?.toLowerCase() === 'get') {
      const key = getRequestKey(config);
      config.__requestKey = key;

      const pending = pendingRequests.get(key);
      if (pending) {
        // Return a cancelled request - the original promise will be used
        const controller = new AbortController();
        controller.abort();
        config.signal = controller.signal;

        // Attach the pending promise to be returned by the response interceptor
        (config as any).__pendingPromise = pending;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Handle success, cleanup, and retry logic
 */
http.interceptors.response.use(
  (response) => {
    // Clean up pending request cache
    const key = (response.config as RetryConfig).__requestKey;
    if (key) {
      pendingRequests.delete(key);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    // If request was cancelled due to deduplication, return the pending promise
    if (axios.isCancel(error) && (config as any)?.__pendingPromise) {
      return (config as any).__pendingPromise;
    }

    if (!config) {
      return Promise.reject(error);
    }

    // Clean up pending request cache on error
    const key = config.__requestKey;
    if (key) {
      pendingRequests.delete(key);
    }

    // Retry configuration
    const MAX_RETRIES = 3;
    const retryCount = config.__retryCount || 0;

    // Determine if we should retry
    const shouldRetry =
      retryCount < MAX_RETRIES &&
      (!error.response || // Network error
        error.response.status >= 500 || // Server error
        error.response.status === 429); // Rate limited

    if (shouldRetry) {
      config.__retryCount = retryCount + 1;

      // Exponential backoff: 1s, 2s, 4s (capped at 10s)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 500;

      console.log(
        `[http] Retrying request (${config.__retryCount}/${MAX_RETRIES}): ${config.url}`
      );

      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      return http.request(config);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to create a GET request that participates in deduplication
 */
export function deduplicatedGet<T = unknown>(
  url: string,
  config?: Omit<InternalAxiosRequestConfig, 'url' | 'method'>
): Promise<AxiosResponse<T>> {
  const requestConfig: RetryConfig = {
    ...config,
    url,
    method: 'get',
  };

  const key = getRequestKey(requestConfig as InternalAxiosRequestConfig);

  // Check if request is already pending
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<AxiosResponse<T>>;
  }

  // Create new request and cache it
  const promise = http.get<T>(url, config);
  pendingRequests.set(key, promise);

  // Clean up on completion
  promise.finally(() => {
    pendingRequests.delete(key);
  });

  return promise;
}

export default http;
