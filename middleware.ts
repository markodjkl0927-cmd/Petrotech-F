import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - always allow access
  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // If it's a public route, always allow access (let the page handle redirects if needed)
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - all require authentication
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/orders') || 
                          pathname.startsWith('/addresses') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/ev-charging') ||
                          pathname.startsWith('/cars') ||
                          pathname.startsWith('/products') ||
                          pathname.startsWith('/payment') ||
                          pathname.startsWith('/admin');

  // For protected routes, check token
  if (isProtectedRoute && !token) {
    // Allow GET requests (page navigation) through
    // Pages will sync cookie and handle authentication client-side
    // This prevents redirect loops when cookie sync happens after page load
    if (request.method === 'GET') {
      return NextResponse.next();
    }
    
    // For non-GET requests (POST, PUT, DELETE, etc.) without token, redirect to login
    // These are likely API calls that need authentication
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

