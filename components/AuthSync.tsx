'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

/**
 * Component to sync authentication token from localStorage to cookie
 * This ensures the middleware can access the token even if it was stored before cookie sync was implemented
 */
export default function AuthSync() {
  const { token } = useAuthStore();

  useEffect(() => {
    // Sync token to cookie whenever token changes or on mount
    if (token && typeof window !== 'undefined') {
      // Check if cookie is already set and matches
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      
      if (!tokenCookie || tokenCookie.split('=')[1] !== token) {
        // Set cookie with 7 days expiration
        const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
        document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      }
    }
  }, [token]);

  return null; // This component doesn't render anything
}
