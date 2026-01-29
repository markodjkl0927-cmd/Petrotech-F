/**
 * Helper function to ensure cookie is set before navigation
 * This prevents middleware from redirecting to login when cookie isn't set yet
 */
export function ensureCookieBeforeNavigation(callback: () => void) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  if (token) {
    // Check if cookie is set
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    const cookieToken = tokenCookie?.split('=')[1];
    
    // If cookie doesn't match or doesn't exist, set it
    if (!cookieToken || cookieToken !== token) {
      const expiresIn = 7 * 24 * 60 * 60; // 7 days
      document.cookie = `token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax`;
    }
  }
  
  // Execute the callback (navigation)
  callback();
}

/**
 * Navigate to a URL with cookie sync
 */
export function navigateWithCookie(url: string, router: any) {
  ensureCookieBeforeNavigation(() => {
    router.push(url);
  });
}
