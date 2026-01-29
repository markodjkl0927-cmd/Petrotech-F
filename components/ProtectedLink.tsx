'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

/**
 * Custom Link component that ensures cookie is set before navigation
 * This prevents middleware from redirecting to login when cookie isn't set yet
 */
export default function ProtectedLink({ href, children, className, onClick, ...props }: ProtectedLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Ensure cookie is set BEFORE navigation
    // This must happen synchronously before Next.js Link navigation
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Always set cookie (even if it exists, refresh it)
        // This ensures it's set before the navigation request
        const expiresIn = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
        
        // Verify cookie was set
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
        const cookieToken = tokenCookie?.split('=')[1];
        
        if (!cookieToken || cookieToken !== token) {
          // Cookie wasn't set properly - prevent navigation and use full page reload
          e.preventDefault();
          window.location.href = href;
          return;
        }
      }
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
