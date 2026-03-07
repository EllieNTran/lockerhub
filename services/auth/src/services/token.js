import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import jose from 'node-jose'
import { fromEnv } from '../constants.js'
import logger from '../logger.js'
import { generateKeys } from '../../scripts/generate-keys.js'

const keysDir = fromEnv('KEYS_DIR') || path.join(process.cwd(), 'keys')
const privateKeyPath = path.join(keysDir, 'private.pem')
const publicKeyPath = path.join(keysDir, 'public.pem')

const KEY_ID = 'lockerhub-auth-key-1'

let privateKey, publicKey, jwkKeystore

try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8')
  publicKey = fs.readFileSync(publicKeyPath, 'utf8')
  logger.info('RSA keys loaded successfully')
} catch (error) {
  logger.info('RSA keys not found. Generating new key pair...')
  const result = generateKeys()

  privateKey = fs.readFileSync(result.privateKeyPath, 'utf8')
  publicKey = fs.readFileSync(result.publicKeyPath, 'utf8')

  logger.info('RSA keys generated and loaded successfully')
  logger.warn('New RSA keys created. In production, use pre-generated keys from secure storage.')
}

const initializeKeystore = async () => {
  try {
    const keystore = jose.JWK.createKeyStore()
    await keystore.add(publicKey, 'pem', {
      kid: KEY_ID,
      use: 'sig',
      alg: 'RS256',
    })
    logger.info('JWK keystore initialized successfully')
    return keystore
  } catch (error) {
    logger.error({ error }, 'Failed to initialize JWK keystore')
    throw error
  }
}

const jwkKeystorePromise = initializeKeystore()
jwkKeystore = await jwkKeystorePromise

/**
 * Generate a JWT access token
 * @param {Object} payload - Token payload
 * @param {string|number} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @param {string} [payload.departmentId] - Department ID (optional)
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  const expiresIn = fromEnv('ACCESS_TOKEN_EXPIRY') || '15m'

  // Generate unique token ID for tracking and revocation
  const tokenId = `${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId || null,
      scope: `user:${payload.role}`, // Scope for fine-grained access control
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,
      issuer: 'lockerhub-auth',
      audience: ['lockerhub-api', 'lockerhub-services'], // Multiple audiences for gateway and services
      jwtid: tokenId, // Unique token identifier
      subject: payload.userId.toString(), // Subject claim
      notBefore: Math.floor(Date.now() / 1000), // Not valid before current time
      keyid: KEY_ID, // Key ID for JWKS key rotation support
    },
  )
}

/**
 * Generate a JWT refresh token
 * @param {Object} payload - Token payload
 * @param {string|number} payload.userId - User ID
 * @returns {string} JWT token
 */
export const generateRefreshToken = (payload) => {
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
      keyid: KEY_ID, // Key ID for JWKS key rotation support
    },
  )
}

/**
 * Verify a JWT token (used internally for refresh token validation)
 * @param {string} token - JWT token to verify
 * @param {Object} options - Verification options
 * @param {string|string[]} [options.audience] - Expected audience(s)
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyToken = (token, options = {}) => {
  const audience = options.audience || ['lockerhub-api', 'lockerhub-services']

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'lockerhub-auth',
    audience,
  })
}

/**
 * Get public key in JWK format for JWKS endpoint
 *
 * Microservices usage pattern:
 * 1. Fetch this endpoint once at startup (or cache with periodic refresh)
 * 2. Extract the public key from the JWKS response
 * 3. Use the public key to verify JWT signatures locally
 * 4. No need to call auth service for each request verification
 *
 * @returns {Object} JWKS (JSON Web Key Set) with the public key
 */
export const getJWKS = () => {
  return jwkKeystore.toJSON()
}
