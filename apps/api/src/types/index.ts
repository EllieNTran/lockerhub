import type { Request } from 'express'

// User types
export interface User {
  userId: string
  email: string
  role: string
  departmentId?: string | null
  scope: string
}

// JWT types
export interface DecodedToken {
  userId: string
  email: string
  role: string
  departmentId?: string | null
  scope: string
  iss: string
  aud: string[]
  jti: string
  sub: string
  nbf: number
  exp: number
  iat: number
}

// JWKS types
export interface JWK {
  kty: string
  kid: string
  use: string
  alg: string
  n: string
  e: string
}

export interface JWKS {
  keys: JWK[]
}

// Error types
export interface AppErrorOptions {
  message: string
  statusCode?: number
  code?: string | null
  isOperational?: boolean
}

// Extended Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: User
}

// JWT verification options
export interface JWTVerifyOptions {
  audience?: string | string[]
  issuer?: string
}
