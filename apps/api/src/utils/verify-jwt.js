import jwt from 'jsonwebtoken'
import jose from 'node-jose'
import logger from '../logger.js'

let publicKeyCache = null
let jwkKeystore = null
let lastFetchTime = 0

const CACHE_TTL = 3600000 // 1 hour
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003'

/**
 * Fetch JWKS from auth service
 * @returns {Promise<Object>} JWKS object
 */
const fetchJWKS = async () => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/.well-known/jwks.json`)

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`)
    }

    const jwks = await response.json()
    logger.info('JWKS fetched successfully from auth service')

    return jwks
  } catch (error) {
    logger.error({ error, url: `${AUTH_SERVICE_URL}/auth/.well-known/jwks.json` }, 'Failed to fetch JWKS')
    throw error
  }
}

/**
 * Get public key for JWT verification
 * Caches the key and refreshes periodically
 * @returns {Promise<string>} Public key in PEM format
 */
const getPublicKey = async () => {
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

    logger.info({ kid: key.kid }, 'Public key cached successfully')

    return publicKeyCache
  } catch (error) {
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
 * @param {string} token - JWT token to verify
 * @param {Object} options - Verification options
 * @returns {Promise<Object>} Decoded token payload
 */
export const verifyTokenWithJWKS = async (token, options = {}) => {
  const publicKey = await getPublicKey()

  const {
    audience = ['lockerhub-api', 'lockerhub-services'],
    issuer = 'lockerhub-auth',
  } = options

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer,
    audience,
  })
}

/**
 * Refresh the public key cache
 * Call this function periodically or on verification failures
 */
export const refreshPublicKey = async () => {
  publicKeyCache = null
  lastFetchTime = 0
  return getPublicKey()
}
