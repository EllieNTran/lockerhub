// User types
export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: string;
  staff_number: string | null;
  department_id: string | null;
  created_at: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

// Token types
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
  scope: string;
  iss: string;
  aud: string[];
  jti: string;
  sub: string;
  nbf: number;
  exp: number;
  iat: number;
}

// Auth types
export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  staffNumber?: string;
  departmentId?: string;
}

export interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

// JWKS types
export interface JWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export interface JWKS {
  keys: JWK[];
}

// Error types
export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

// Database query result types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
  command: string;
  fields: any[];
}
