import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokens';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — try to refresh, then retry original request once
let isRefreshing = false;
let failQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refresh = await getRefreshToken();
      if (!refresh) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh`, {
        refresh_token: refresh,
      });

      const newAccess: string = data.access_token;
      const existingRefresh = refresh;
      await saveTokens(newAccess, existingRefresh);

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      // Signal auth store to log out
      authLogoutCallback?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Callback registered by auth store so interceptor can trigger logout
let authLogoutCallback: (() => void) | null = null;
export function registerLogoutCallback(fn: () => void) {
  authLogoutCallback = fn;
}
