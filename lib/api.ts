import axios from 'axios';
import { useAuthStore } from '@/lib/store';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function getTokenFromPersistedStore(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist format: { state: { token, ... }, version: number }
    const token = parsed?.state?.token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1) Preferred: legacy localStorage key (used across the app)
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  // 2) In-memory store (rehydrated state)
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;

  // 3) Persisted Zustand storage (covers cases where 'token' key was cleared)
  return getTokenFromPersistedStore();
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear auth state consistently (includes persisted store + cookie)
        useAuthStore.getState().clearAuth();

        // Avoid redirect loops on auth pages
        const currentPath = window.location.pathname || '/';
        if (currentPath !== '/login' && currentPath !== '/register') {
          const loginUrl = new URL('/login', window.location.origin);
          loginUrl.searchParams.set('redirect', currentPath);
          window.location.href = loginUrl.toString();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

