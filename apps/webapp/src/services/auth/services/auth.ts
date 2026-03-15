import { apiClient } from '@/services/apiClient';
import type { User } from '@/types/auth';

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  staffNumber?: string;
  departmentId?: string;
  office?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiClient.publicRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.publicRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  return apiClient.publicRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Logout user
 */
export async function logout(refreshToken: string): Promise<{ message: string }> {
  return apiClient.publicRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
