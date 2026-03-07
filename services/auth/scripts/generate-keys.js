#!/usr/bin/env node

import { generateKeyPairSync } from 'crypto'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const KEYS_DIR = join(__dirname, '..', 'keys')
const PRIVATE_KEY_PATH = join(KEYS_DIR, 'private.pem')
const PUBLIC_KEY_PATH = join(KEYS_DIR, 'public.pem')

/**
 * Generate RSA key pair for JWT signing
 * @param {boolean} force - Overwrite existing keys if true
 */
export function generateKeys(force = false) {
  if (!force && (existsSync(PRIVATE_KEY_PATH) || existsSync(PUBLIC_KEY_PATH))) {
    return { existed: true, privateKeyPath: PRIVATE_KEY_PATH, publicKeyPath: PUBLIC_KEY_PATH }
  }

  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true })
  }

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 })
  writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 })

  return { existed: false, privateKeyPath: PRIVATE_KEY_PATH, publicKeyPath: PUBLIC_KEY_PATH }
}
