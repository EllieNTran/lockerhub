/**
 * Store auth tokens in localStorage
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
}

/**
 * Decode JWT token payload
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get user ID from stored access token
 */
export function getUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  
  const payload = decodeJWT(token);
  return payload?.userId as string || null;
}
