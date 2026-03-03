import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fromEnv } from '../constants.js'
import logger from '../logger.js'
import { generateKeys } from '../../scripts/generate-keys.js'

// Load or generate RSA keys
const keysDir = fromEnv('KEYS_DIR') || path.join(process.cwd(), 'keys')
const privateKeyPath = path.join(keysDir, 'private.pem')
const publicKeyPath = path.join(keysDir, 'public.pem')

let privateKey, publicKey

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

/**
 * Generate a JWT access token
 * @param {Object} payload - Token payload
 * @param {string|number} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  const expiresIn = fromEnv('ACCESS_TOKEN_EXPIRY') || '15m'
  
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn,
    issuer: 'lockerhub-auth',
    audience: 'lockerhub-api',
  })
}

/**
 * Generate a JWT refresh token
 * @param {Object} payload - Token payload
 * @param {string|number} payload.userId - User ID
 * @returns {string} JWT token
 */
export const generateRefreshToken = (payload) => {
  const expiresIn = fromEnv('REFRESH_TOKEN_EXPIRY') || '7d'
  
  return jwt.sign(
    { userId: payload.userId },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn,
      issuer: 'lockerhub-auth',
      audience: 'lockerhub-api',
    }
  )
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export const verifyToken = (token) => {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'lockerhub-auth',
    audience: 'lockerhub-api',
  })
}

/**
 * Get public key for token verification (shared with other services)
 * @returns {string} Public key in PEM format
 */
export const getPublicKey = () => {
  return publicKey
}
