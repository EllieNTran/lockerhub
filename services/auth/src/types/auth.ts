import type { UserResponse } from './user'

// Authentication Request Types
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

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// Authentication Response Types
export interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutResponse {
  message: string;
}
