export type RuntimeEnv = {
  apiBaseUrl?: string;
  socketUrl?: string;
};

declare global {
  interface Window {
    __RUNTIME_ENV__?: RuntimeEnv;
  }
}

export function getRuntimeEnv(): RuntimeEnv {
  if (typeof window !== 'undefined' && window.__RUNTIME_ENV__) {
    return window.__RUNTIME_ENV__;
  }

  return {
    apiBaseUrl: process.env.NEXT_PRIVATE_API_BASE_URL,
    socketUrl: process.env.NEXT_PRIVATE_SOCKET_URL,
  };
}
