import type { Request } from 'express'

export interface User {
  userId: string
  email: string
  role: string
  departmentId?: string | null
  scope: string
}

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

export interface AppErrorOptions {
  message: string
  statusCode?: number
  code?: string | null
  isOperational?: boolean
}

export interface AuthenticatedRequest extends Request {
  user?: User
}

export interface JWTVerifyOptions {
  audience?: string | string[]
  issuer?: string
}
