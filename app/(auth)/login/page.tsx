'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated (only on client side)
  // But ensure cookie is set first to avoid redirect loop
  useEffect(() => {
    if (!mounted) return;
    
    // Check if we have a token in localStorage
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Only redirect if we have BOTH token and user
    if (isAuthenticated && user && localToken) {
      // Ensure cookie is set before redirecting
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      const cookieToken = tokenCookie?.split('=')[1];
      
      // Always set cookie to ensure it's there (even if it exists, refresh it)
      const expiresIn = 7 * 24 * 60 * 60; // 7 days
      document.cookie = `token=${localToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      
      // Determine redirect URL
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
      let redirectUrl = '/dashboard';
      
      if (redirectParam) {
        redirectUrl = redirectParam;
        sessionStorage.removeItem('redirectAfterLogin');
      } else if (savedRedirect) {
        redirectUrl = savedRedirect;
        sessionStorage.removeItem('redirectAfterLogin');
      } else if (user.role === 'ADMIN') {
        redirectUrl = '/admin/dashboard';
      } else {
        redirectUrl = '/dashboard';
      }
      
      // Use window.location.href for full page reload to ensure cookie is sent with request
      // This ensures middleware can see the cookie on the next request
      window.location.href = redirectUrl;
    }
  }, [mounted, isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      const { user, token } = response.data;

      if (!user || !token) {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }

      console.log('Setting auth:', { user, token });
      
      // Set auth state (this also sets the cookie)
      setAuth(user, token);
      
      // Also set cookie explicitly to ensure it's set
      const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
      document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      
      // Redirect based on user role or saved redirect
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
      let redirectUrl = '/dashboard';
      
      if (redirectParam) {
        redirectUrl = redirectParam;
        sessionStorage.removeItem('redirectAfterLogin');
      } else if (savedRedirect) {
        redirectUrl = savedRedirect;
        sessionStorage.removeItem('redirectAfterLogin');
      } else if (user.role === 'ADMIN') {
        redirectUrl = '/admin/dashboard';
      } else {
        redirectUrl = '/dashboard';
      }
      
      // Use window.location.href for full page reload to ensure cookie is sent
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-soft p-8 space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 mb-4 flex items-center justify-center">
              <Image
                src="/assets/logo_2.png"
                alt="Petrotech Logo"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to Petrotech
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
                create a new account
              </Link>
            </p>
          </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

