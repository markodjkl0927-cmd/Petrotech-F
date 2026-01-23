'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!mounted) {
    return null;
  }

  return (
      <header className="bg-white w-full sticky top-0 z-50 border-b border-gray-200 pointer-events-auto shadow-sm">
        <div className="w-full mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-36 h-36 flex items-center justify-center relative">
                  <Image
                    src="/assets/logo.png"
                    alt="Petrotech Logo"
                    width={144}
                    height={144}
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Navigation Links - Centered */}
            <nav className="hidden md:flex items-center justify-end flex-1 gap-8 mr-10">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-gray-900 hover:text-gray-700 transition-all duration-200 font-medium text-sm whitespace-nowrap cursor-pointer bg-transparent border-none hover:scale-105"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push('/products');
                  } else {
                    router.push('/login?redirect=/products');
                  }
                }}
                className="text-gray-900 hover:text-gray-700 transition-all duration-200 font-medium text-sm whitespace-nowrap cursor-pointer bg-transparent border-none hover:scale-105"
              >
                Products
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => router.push('/orders')}
                  className="text-gray-900 hover:text-gray-700 transition-colors duration-200 font-medium text-sm whitespace-nowrap cursor-pointer bg-transparent border-none"
                >
                  Orders
                </button>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => router.push('/addresses')}
                  className="text-gray-900 hover:text-gray-700 transition-colors duration-200 font-medium text-sm whitespace-nowrap cursor-pointer bg-transparent border-none"
                >
                  Addresses
                </button>
              )}
            </nav>

            {/* User Menu / CTA Button - Right aligned */}
            <div className="flex items-center flex-shrink-0">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">
                        {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign out</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                  Sign up / Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
  );
}
