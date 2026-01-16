import crypto from 'crypto';
import { config } from '../config';

// ============================================
// Encryption Configuration
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = 'hex';

// ============================================
// Encryption Service
// ============================================

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, config.encryptionKey, iv);

  // Encrypt the data
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get the auth tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv,
    authTag,
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData): string {
  const { encrypted, iv, authTag } = encryptedData;

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, config.encryptionKey, iv);
  decipher.setAuthTag(authTag);

  // Decrypt the data
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Encrypt a JSON object
 */
export function encryptJson(data: Record<string, any>): EncryptedData {
  const jsonString = JSON.stringify(data);
  return encrypt(jsonString);
}

/**
 * Decrypt to a JSON object
 */
export function decryptJson<T = Record<string, any>>(encryptedData: EncryptedData): T {
  const jsonString = decrypt(encryptedData);
  return JSON.parse(jsonString) as T;
}

/**
 * Convert encrypted data to storable format (for database)
 */
export function toStorageFormat(encryptedData: EncryptedData): {
  credentialsEncrypted: Buffer;
  encryptionIv: Buffer;
  authTag: Buffer;
} {
  return {
    credentialsEncrypted: encryptedData.encrypted,
    encryptionIv: encryptedData.iv,
    authTag: encryptedData.authTag,
  };
}

/**
 * Convert from storage format back to encrypted data
 */
export function fromStorageFormat(stored: {
  credentialsEncrypted: Buffer;
  encryptionIv: Buffer;
  authTag: Buffer;
}): EncryptedData {
  return {
    encrypted: stored.credentialsEncrypted,
    iv: stored.encryptionIv,
    authTag: stored.authTag,
  };
}

/**
 * Generate a secure random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token (for refresh tokens)
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
