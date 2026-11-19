import axios from 'axios';
import { useToastStore } from '../store/toastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

let slowTimer = null;
let activeRequests = 0;

api.interceptors.request.use((config) => {
  activeRequests += 1;
  if (activeRequests === 1 && !slowTimer) {
    slowTimer = setTimeout(() => {
      useToastStore.getState().info('Waking up server, please wait a moment...', 5000);
    }, 4000);
  }

  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clearSlowTimer = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0 && slowTimer) {
    clearTimeout(slowTimer);
    slowTimer = null;
  }
};

// Track if we're already attempting a refresh to prevent infinite loops
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => {
    clearSlowTimer();
    return res;
  },
  async (err) => {
    clearSlowTimer();
    const originalRequest = err.config;

    // Only intercept 401 errors that haven't been retried yet
    // and skip the refresh endpoint itself to avoid infinite loops
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue the request until the refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export default api;
