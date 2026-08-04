import * as crypto from 'crypto';
import { EncryptionService } from './encryption.service';

describe(EncryptionService, () => {
  let service: EncryptionService;
  let mockConfig: { encryptionKey: Buffer };

  beforeEach(() => {
    mockConfig = {
      encryptionKey: crypto.randomBytes(32),
    };
    service = new EncryptionService(mockConfig as any);
  });

  describe('encrypt/decrypt', () => {
    it('round-trips plaintext through encrypt then decrypt', () => {
      const plaintext = 'hello world';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('produces different ciphertext and iv for repeated calls on the same input', () => {
      const plaintext = 'same input';
      const first = service.encrypt(plaintext);
      const second = service.encrypt(plaintext);

      expect(first.iv.equals(second.iv)).toBe(false);
      expect(first.encrypted.equals(second.encrypted)).toBe(false);
    });

    it('returns Buffer instances for encrypted, iv, and authTag', () => {
      const result = service.encrypt('data');

      expect(Buffer.isBuffer(result.encrypted)).toBe(true);
      expect(Buffer.isBuffer(result.iv)).toBe(true);
      expect(Buffer.isBuffer(result.authTag)).toBe(true);
      expect(result.iv).toHaveLength(16);
    });

    it('throws when the auth tag has been tampered with', () => {
      const encrypted = service.encrypt('tamper test');
      const tampered = {
        ...encrypted,
        authTag: Buffer.from(encrypted.authTag),
      };
      tampered.authTag[0] = tampered.authTag[0] ^ 0xff;

      expect(() => service.decrypt(tampered)).toThrow();
    });
  });

  describe('encryptJson/decryptJson', () => {
    it('round-trips an object through encryptJson then decryptJson', () => {
      const data = { foo: 'bar', num: 42, nested: { a: [1, 2, 3] } };
      const encrypted = service.encryptJson(data);
      const decrypted = service.decryptJson(encrypted);

      expect(decrypted).toEqual(data);
    });
  });

  describe('toStorageFormat/fromStorageFormat', () => {
    it('round-trips through toStorageFormat then fromStorageFormat', () => {
      const encrypted = service.encrypt('storage round trip');
      const stored = service.toStorageFormat(encrypted);

      expect(stored.credentialsEncrypted).toBe(encrypted.encrypted);
      expect(stored.encryptionIv).toBe(encrypted.iv);
      expect(stored.authTag).toBe(encrypted.authTag);

      const restored = service.fromStorageFormat(stored);

      expect(restored).toEqual(encrypted);
      expect(service.decrypt(restored)).toBe('storage round trip');
    });
  });

  describe('hashToken', () => {
    it('is deterministic for the same input', () => {
      const token = 'my-token-value';

      expect(service.hashToken(token)).toBe(service.hashToken(token));
    });

    it('produces different hashes for different inputs', () => {
      expect(service.hashToken('token-a')).not.toBe(
        service.hashToken('token-b'),
      );
    });

    it('returns a 64-character hex sha256 digest', () => {
      const hash = service.hashToken('some-token');

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateToken', () => {
    it('defaults to 32 bytes, producing a 64-character hex string', () => {
      const token = service.generateToken();

      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('respects a custom byte length', () => {
      const token = service.generateToken(16);

      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it('generates unique values across calls', () => {
      const a = service.generateToken();
      const b = service.generateToken();

      expect(a).not.toBe(b);
    });
  });
});
