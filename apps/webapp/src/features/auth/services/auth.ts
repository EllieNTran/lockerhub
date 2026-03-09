import type { SignupRequest, SignupResponse, LoginRequest, LoginResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Signup failed' }));
    throw new Error(error.message || 'Signup failed');
  }

  return response.json();
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Token refresh failed' }));
    throw new Error(error.message || 'Token refresh failed');
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logout(refreshToken: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Logout failed' }));
    throw new Error(error.message || 'Logout failed');
  }

  return response.json();
}

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
 * Get list of departments
 */
export async function getDepartments(): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/metadata/departments`);

  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }

  const data = await response.json();
  return data.departments;
}

/**
 * Get list of office locations
 */
export async function getOffices(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/metadata/offices`);

  if (!response.ok) {
    throw new Error('Failed to fetch offices');
  }

  const data = await response.json();
  return data.offices;
}

/**
 * Validate staff number availability
 */
export async function validateStaffNumber(staffNumber: string): Promise<{ available: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/metadata/validate-staff-number/${staffNumber}`);

  if (!response.ok) {
    throw new Error('Failed to validate staff number');
  }

  return response.json();
}
