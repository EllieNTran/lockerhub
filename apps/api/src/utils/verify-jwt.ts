import jwt from 'jsonwebtoken'
import jose from 'node-jose'
import logger from '../logger'
import type { DecodedToken, JWKS, JWTVerifyOptions } from '../types'

let publicKeyCache: string | null = null
let jwkKeystore: jose.JWK.KeyStore | null = null
let lastFetchTime = 0

const CACHE_TTL = 3600000 // 1 hour
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003'

/**
 * Fetch JWKS from auth service
 */
const fetchJWKS = async (): Promise<JWKS> => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/.well-known/jwks.json`)

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`)
    }

    const jwks = await response.json() as JWKS
    logger.info('JWKS fetched successfully from auth service')

    return jwks
  } catch (error: unknown) {
    logger.error({ error, url: `${AUTH_SERVICE_URL}/auth/.well-known/jwks.json` }, 'Failed to fetch JWKS')
    throw error
  }
}

/**
 * Get public key for JWT verification
 * Caches the key and refreshes periodically
 */
const getPublicKey = async (): Promise<string> => {
  const now = Date.now()

  // Return cached key if still valid
  if (publicKeyCache && (now - lastFetchTime) < CACHE_TTL) {
    return publicKeyCache
  }

  try {
    const jwks = await fetchJWKS()
    jwkKeystore = await jose.JWK.asKeyStore(jwks)

    const key = jwkKeystore.all()[0]

    if (!key) {
      throw new Error('No keys found in JWKS')
    }

    publicKeyCache = key.toPEM()
    lastFetchTime = now

    logger.info('Public key cached successfully')

    return publicKeyCache
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to get public key')

    if (publicKeyCache) {
      logger.warn('Using expired cached public key as fallback')
      return publicKeyCache
    }

    throw error
  }
}

/**
 * Verify JWT token using cached public key
 */
export const verifyTokenWithJWKS = async (token: string, options: JWTVerifyOptions = {}): Promise<DecodedToken> => {
  const publicKey = await getPublicKey()

  const {
    audience = ['lockerhub-api', 'lockerhub-services'],
    issuer = 'lockerhub-auth',
  } = options

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer,
    audience: Array.isArray(audience) ? audience[0] : audience,
  }) as DecodedToken
}

/**
 * Refresh the public key cache
 * Call this function periodically or on verification failures
 */
export const refreshPublicKey = async (): Promise<string> => {
  publicKeyCache = null
  lastFetchTime = 0
  return getPublicKey()
}
