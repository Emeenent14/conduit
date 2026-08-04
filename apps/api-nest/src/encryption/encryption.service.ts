import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../config/app-config.service';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Verbatim port of services/encryption.service.ts. The algorithm, IV
 * length, and storage format must stay byte-identical to the Express
 * version so existing encrypted rows in the database keep decrypting.
 */
@Injectable()
export class EncryptionService {
  constructor(private readonly config: AppConfigService) {}

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      this.config.encryptionKey,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return { encrypted, iv, authTag };
  }

  decrypt(encryptedData: EncryptedData): string {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.config.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  encryptJson(data: Record<string, any>): EncryptedData {
    return this.encrypt(JSON.stringify(data));
  }

  decryptJson<T = Record<string, any>>(encryptedData: EncryptedData): T {
    return JSON.parse(this.decrypt(encryptedData)) as T;
  }

  toStorageFormat(encryptedData: EncryptedData): {
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

  fromStorageFormat(stored: {
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

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
