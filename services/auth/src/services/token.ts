import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import jose from 'node-jose'
import { fromEnv } from '../constants'
import logger from '../logger'
import { generateKeys } from '../utils/generate-keys'
import type { TokenPayload, DecodedToken, JWKS } from '../types'

const keysDir = fromEnv('KEYS_DIR') || path.join(process.cwd(), 'keys')
const privateKeyPath = path.join(keysDir, 'private.pem')
const publicKeyPath = path.join(keysDir, 'public.pem')

const KEY_ID = 'lockerhub-auth-key-1'

let privateKey: string
let publicKey: string

try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8')
  publicKey = fs.readFileSync(publicKeyPath, 'utf8')
  logger.info('RSA keys loaded successfully')
} catch {
  logger.info('RSA keys not found. Generating new key pair...')
  const result = generateKeys()

  privateKey = fs.readFileSync(result.privateKeyPath, 'utf8')
  publicKey = fs.readFileSync(result.publicKeyPath, 'utf8')

  logger.info('RSA keys generated and loaded successfully')
  logger.warn('New RSA keys created. In production, use pre-generated keys from secure storage.')
}

const initializeKeystore = async (): Promise<jose.JWK.KeyStore> => {
  try {
    const keystore = jose.JWK.createKeyStore()
    await keystore.add(publicKey, 'pem', {
      kid: KEY_ID,
      use: 'sig',
      alg: 'RS256',
    })
    logger.info('JWK keystore initialized successfully')
    return keystore
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to initialize JWK keystore')
    throw error
  }
}

const jwkKeystore = await initializeKeystore()

/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const expiresIn = payload.role === 'admin' ? '30m' : '15m'

  const tokenId = `${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId || null,
      scope: `user:${payload.role}`,
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,
      issuer: 'lockerhub-auth',
      audience: ['lockerhub-api', 'lockerhub-services'],
      jwtid: tokenId,
      subject: payload.userId.toString(),
      keyid: KEY_ID, // Key ID for JWKS key rotation support
    } as jwt.SignOptions,
  )
}

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (payload: Pick<TokenPayload, 'userId'>): string => {
  const expiresIn = fromEnv('REFRESH_TOKEN_EXPIRY') || '7d'

  const tokenId = `refresh-${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`

  return jwt.sign(
    {
      userId: payload.userId,
      tokenType: 'refresh',
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,
      issuer: 'lockerhub-auth',
      audience: ['lockerhub-api', 'lockerhub-services'],
      jwtid: tokenId,
      subject: payload.userId.toString(),
      keyid: KEY_ID,
    } as jwt.SignOptions,
  )
}

/**
 * Verify a JWT token (used internally for refresh token validation)
 */
export const verifyToken = (token: string, options: { audience?: string | string[] } = {}): DecodedToken => {
  const defaultAudience = ['lockerhub-api', 'lockerhub-services'] as const
  const audience = options.audience
    ? (Array.isArray(options.audience) ? options.audience[0] : options.audience)
    : defaultAudience[0]

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'lockerhub-auth',
    audience,
  }) as DecodedToken
}

/**
 * Get public key in JWK format for JWKS endpoint
 */
export const getJWKS = (): JWKS => {
  return jwkKeystore.toJSON() as JWKS
}
