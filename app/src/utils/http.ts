import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { getRuntimeEnv } from './runtimeEnv';
import { getAuthHeaders } from './authTokens';
import { setDatabaseConnected } from './databaseStatus';

const pendingRequests = new Map<string, Promise<AxiosResponse>>();

function getRequestKey(config: InternalAxiosRequestConfig): string {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase()}:${config.url}:${params}`;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __requestKey?: string;
  __pendingPromise?: Promise<AxiosResponse>;
}

// Create axios instance with base configuration
export const http = axios.create({
  baseURL: getRuntimeEnv().apiBaseUrl || undefined,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor - injects JWT and CSRF token in all requests
http.interceptors.request.use(
  async (config: RetryConfig) => {
    // Get auth headers (JWT Bearer token + CSRF token)
    const authHeaders = await getAuthHeaders();

    // Merge auth headers with existing headers
    if (authHeaders.Authorization) {
      config.headers.set('Authorization', authHeaders.Authorization);
    }
    if (authHeaders['X-CSRF-Token']) {
      config.headers.set('X-CSRF-Token', authHeaders['X-CSRF-Token']);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Deduplication interceptor
http.interceptors.request.use(
  (config: RetryConfig) => {
    if (config.method?.toLowerCase() === 'get') {
      const key = getRequestKey(config);
      config.__requestKey = key;

      const pending = pendingRequests.get(key);
      if (pending) {
        const controller = new AbortController();
        controller.abort();
        config.signal = controller.signal;

        config.__pendingPromise = pending;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => {
    const key = (response.config as RetryConfig).__requestKey;
    if (key) {
      pendingRequests.delete(key);
    }
    // Mark database as connected on successful response
    setDatabaseConnected(true);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    if (axios.isCancel(error) && config?.__pendingPromise) {
      return config.__pendingPromise;
    }

    if (!config) {
      return Promise.reject(error);
    }

    const key = config.__requestKey;
    if (key) {
      pendingRequests.delete(key);
    }

    // Mark database as disconnected on connection failure or server error
    if (!error.response || error.response.status === 503 || error.code === 'ECONNREFUSED') {
      setDatabaseConnected(false);
    }

    const MAX_RETRIES = 3;
    const retryCount = config.__retryCount || 0;

    const shouldRetry =
      retryCount < MAX_RETRIES &&
      (!error.response || //Network error
        error.response.status >= 500 || //Server error
        error.response.status === 429); //Rate limited

    if (shouldRetry) {
      config.__retryCount = retryCount + 1;

      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

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

export function deduplicatedGet<T = unknown>(
  url: string,
  config?: Omit<InternalAxiosRequestConfig, 'url' | 'method'>
): Promise<AxiosResponse<T>> {
  const requestConfig: RetryConfig = {
    ...config,
    url,
    method: 'get',
    headers: config?.headers ?? new AxiosHeaders(),
  };

  const key = getRequestKey(requestConfig as InternalAxiosRequestConfig);

  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<AxiosResponse<T>>;
  }

  const promise = http.get<T>(url, config);
  pendingRequests.set(key, promise);

  promise.finally(() => {
    pendingRequests.delete(key);
  });

  return promise;
}

export default http;
