import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        console.log('setAuth called:', { user, token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          // Also set in cookie for middleware
          document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true });
        console.log('Auth state updated');
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Remove cookie
          document.cookie = 'token=; path=/; max-age=0';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: !!state.token,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Rehydrating auth state:', state);
        if (state?.token) {
          // Try to get user from localStorage if not in state
          if (!state.user && typeof window !== 'undefined') {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              try {
                state.user = JSON.parse(savedUser);
              } catch (e) {
                console.error('Failed to parse saved user:', e);
              }
            }
          }
          state.isAuthenticated = true;
        }
      },
    }
  )
);

