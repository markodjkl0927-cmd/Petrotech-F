'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

/**
 * Component to sync authentication token from localStorage to cookie
 * This ensures the middleware can access the token on every page load
 */
export default function AuthSync() {
  const { token } = useAuthStore();

  // Sync immediately on mount from localStorage (before Zustand rehydrates)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Sync from localStorage immediately (in case Zustand hasn't rehydrated yet)
    const localToken = localStorage.getItem('token');
    if (localToken) {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      const cookieToken = tokenCookie?.split('=')[1];
      
      if (!cookieToken || cookieToken !== localToken) {
        const expiresIn = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `token=${localToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      }
    }
  }, []); // Run only on mount

  // Also sync when token changes (after Zustand rehydrates)
  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      const cookieToken = tokenCookie?.split('=')[1];
      
      if (!cookieToken || cookieToken !== token) {
        const expiresIn = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      }
    }
  }, [token]);

  return null; // This component doesn't render anything
}
