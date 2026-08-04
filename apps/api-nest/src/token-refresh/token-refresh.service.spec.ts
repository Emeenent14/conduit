import { TokenRefreshService } from './token-refresh.service';

const FIXED_NOW = new Date('2024-06-01T12:00:00.000Z');

describe(TokenRefreshService, () => {
  let service: TokenRefreshService;
  let mockPrisma: {
    credential: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let mockEncryption: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
  };
  let mockGoogleOAuth: {
    refreshAccessToken: jest.Mock;
  };
  let mockN8nCredential: {
    resyncCredentialToN8n: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);

    mockPrisma = {
      credential: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    mockEncryption = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };
    mockGoogleOAuth = {
      refreshAccessToken: jest.fn(),
    };
    mockN8nCredential = {
      resyncCredentialToN8n: jest.fn(),
    };

    service = new TokenRefreshService(
      mockPrisma as any,
      mockEncryption as any,
      mockGoogleOAuth as any,
      mockN8nCredential as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('refreshCredentialToken', () => {
    it('throws when the credential is not found', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.refreshCredentialToken('cred-1')).rejects.toThrow(
        'Credential not found',
      );
    });

    it('throws when the app authType is not oauth2', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        app: { authType: 'api_key', slug: 'openai' },
      });

      await expect(service.refreshCredentialToken('cred-1')).rejects.toThrow(
        'Credential is not OAuth2 type',
      );
    });

    it('is a no-op for slack (logs only, no refresh attempted)', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        app: { authType: 'oauth2', slug: 'slack' },
      });

      await expect(
        service.refreshCredentialToken('cred-1'),
      ).resolves.toBeUndefined();

      expect(mockGoogleOAuth.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockPrisma.credential.update).not.toHaveBeenCalled();
    });

    it('logs a warning and no-ops for an unknown provider slug', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        app: { authType: 'oauth2', slug: 'hubspot' },
      });

      await expect(
        service.refreshCredentialToken('cred-1'),
      ).resolves.toBeUndefined();

      expect(mockGoogleOAuth.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockPrisma.credential.update).not.toHaveBeenCalled();
    });

    describe('google provider', () => {
      const googleCredential = {
        id: 'cred-1',
        app: { authType: 'oauth2', slug: 'google' },
        oauthRefreshTokenEncrypted: Buffer.from('refresh-enc'),
        encryptionIv: Buffer.from('iv'),
        authTag: Buffer.from('tag'),
      };

      it('throws when there is no refresh token available', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue({
          ...googleCredential,
          oauthRefreshTokenEncrypted: null,
        });

        await expect(service.refreshCredentialToken('cred-1')).rejects.toThrow(
          'No refresh token available',
        );
        expect(mockGoogleOAuth.refreshAccessToken).not.toHaveBeenCalled();
      });

      it('refreshes, re-encrypts, updates Prisma, and resyncs to n8n on the happy path', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue(googleCredential);
        mockEncryption.decrypt.mockReturnValue('plain-refresh-token');
        mockGoogleOAuth.refreshAccessToken.mockResolvedValue({
          access_token: 'new-access-token',
          expires_in: 3600,
          scope: 'scope',
          token_type: 'Bearer',
        });
        mockEncryption.encrypt.mockReturnValue({
          encrypted: Buffer.from('new-enc'),
          iv: Buffer.from('new-iv'),
          authTag: Buffer.from('new-tag'),
        });
        mockPrisma.credential.update.mockResolvedValue({});
        mockN8nCredential.resyncCredentialToN8n.mockResolvedValue(undefined);

        await service.refreshCredentialToken('cred-1');

        expect(mockEncryption.decrypt).toHaveBeenCalledWith({
          encrypted: googleCredential.oauthRefreshTokenEncrypted,
          iv: googleCredential.encryptionIv,
          authTag: googleCredential.authTag,
        });
        expect(mockGoogleOAuth.refreshAccessToken).toHaveBeenCalledWith(
          'plain-refresh-token',
        );
        expect(mockEncryption.encrypt).toHaveBeenCalledWith('new-access-token');
        expect(mockPrisma.credential.update).toHaveBeenCalledWith({
          where: { id: 'cred-1' },
          data: {
            oauthAccessTokenEncrypted: Buffer.from('new-enc'),
            encryptionIv: Buffer.from('new-iv'),
            authTag: Buffer.from('new-tag'),
            oauthExpiresAt: new Date(FIXED_NOW.getTime() + 3600 * 1000),
            isValid: true,
            validationError: null,
            lastValidatedAt: expect.any(Date),
          },
        });
        expect(mockN8nCredential.resyncCredentialToN8n).toHaveBeenCalledWith(
          'cred-1',
        );
      });

      it('marks the credential invalid and rethrows when refreshAccessToken rejects', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue(googleCredential);
        mockEncryption.decrypt.mockReturnValue('plain-refresh-token');
        const failure = new Error('google says no');
        mockGoogleOAuth.refreshAccessToken.mockRejectedValue(failure);
        mockPrisma.credential.update.mockResolvedValue({});

        await expect(service.refreshCredentialToken('cred-1')).rejects.toThrow(
          'google says no',
        );

        expect(mockPrisma.credential.update).toHaveBeenCalledWith({
          where: { id: 'cred-1' },
          data: {
            isValid: false,
            validationError:
              'Failed to refresh access token. Please reconnect your account.',
            lastValidatedAt: expect.any(Date),
          },
        });
        expect(mockN8nCredential.resyncCredentialToN8n).not.toHaveBeenCalled();
      });
    });
  });

  describe('refreshExpiringTokensForUser', () => {
    it('queries credentials with a non-null oauthExpiresAt for the user', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([]);

      await service.refreshExpiringTokensForUser('user-1');

      expect(mockPrisma.credential.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', oauthExpiresAt: { not: null } },
        include: { app: true },
      });
    });

    it('refreshes only credentials expiring within 5 minutes, counts successes, and continues past a failure', async () => {
      const expiringSoon = {
        id: 'cred-expiring',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 4 * 60 * 1000),
      };
      const notExpiringSoon = {
        id: 'cred-far',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 60 * 60 * 1000),
      };
      const alsoExpiringSoon = {
        id: 'cred-expiring-2',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 1 * 60 * 1000),
      };
      mockPrisma.credential.findMany.mockResolvedValue([
        expiringSoon,
        notExpiringSoon,
        alsoExpiringSoon,
      ]);

      const refreshSpy = jest
        .spyOn(service, 'refreshCredentialToken')
        .mockImplementation(async (id: string) => {
          await Promise.resolve();
          if (id === 'cred-expiring') {
            throw new Error('refresh failed');
          }
          return undefined;
        });

      const count = await service.refreshExpiringTokensForUser('user-1');

      expect(refreshSpy).toHaveBeenCalledTimes(2);
      expect(refreshSpy).toHaveBeenCalledWith('cred-expiring');
      expect(refreshSpy).toHaveBeenCalledWith('cred-expiring-2');
      expect(refreshSpy).not.toHaveBeenCalledWith('cred-far');
      expect(count).toBe(1);
    });
  });

  describe('refreshAllExpiringTokens', () => {
    it('queries credentials expiring within 10 minutes that have a refresh token', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([]);

      await service.refreshAllExpiringTokens();

      expect(mockPrisma.credential.findMany).toHaveBeenCalledWith({
        where: {
          oauthExpiresAt: {
            not: null,
            lte: new Date(FIXED_NOW.getTime() + 10 * 60 * 1000),
          },
          oauthRefreshTokenEncrypted: { not: null },
        },
        include: { app: true },
      });
    });

    it('counts successes and continues past a failure across all eligible credentials', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([
        { id: 'cred-a' },
        { id: 'cred-b' },
      ]);

      const refreshSpy = jest
        .spyOn(service, 'refreshCredentialToken')
        .mockImplementation(async (id: string) => {
          await Promise.resolve();
          if (id === 'cred-a') {
            throw new Error('refresh failed');
          }
          return undefined;
        });

      const count = await service.refreshAllExpiringTokens();

      expect(refreshSpy).toHaveBeenCalledTimes(2);
      expect(refreshSpy).toHaveBeenCalledWith('cred-a');
      expect(refreshSpy).toHaveBeenCalledWith('cred-b');
      expect(count).toBe(1);
    });
  });

  describe('getValidAccessToken', () => {
    it('throws when the credential is not found', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.getValidAccessToken('cred-1')).rejects.toThrow(
        'Credential not found',
      );
    });

    it('returns the current decrypted token without refreshing when not expiring soon', async () => {
      const credential = {
        id: 'cred-1',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 60 * 60 * 1000),
        oauthAccessTokenEncrypted: Buffer.from('current-enc'),
        encryptionIv: Buffer.from('iv'),
        authTag: Buffer.from('tag'),
      };
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decrypt.mockReturnValue('current-plain-token');
      const refreshSpy = jest.spyOn(service, 'refreshCredentialToken');

      const result = await service.getValidAccessToken('cred-1');

      expect(refreshSpy).not.toHaveBeenCalled();
      expect(mockEncryption.decrypt).toHaveBeenCalledWith({
        encrypted: credential.oauthAccessTokenEncrypted,
        iv: credential.encryptionIv,
        authTag: credential.authTag,
      });
      expect(result).toBe('current-plain-token');
    });

    it('throws when not expiring soon and there is no access token at all', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 60 * 60 * 1000),
        oauthAccessTokenEncrypted: null,
      });

      await expect(service.getValidAccessToken('cred-1')).rejects.toThrow(
        'No access token available',
      );
      expect(mockEncryption.decrypt).not.toHaveBeenCalled();
    });

    it('refreshes then decrypts the NEW token when expiring soon', async () => {
      const initialCredential = {
        id: 'cred-1',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 4 * 60 * 1000),
        oauthAccessTokenEncrypted: Buffer.from('old-enc'),
        encryptionIv: Buffer.from('old-iv'),
        authTag: Buffer.from('old-tag'),
      };
      const refreshedCredential = {
        id: 'cred-1',
        oauthAccessTokenEncrypted: Buffer.from('new-enc'),
        encryptionIv: Buffer.from('new-iv'),
        authTag: Buffer.from('new-tag'),
      };
      mockPrisma.credential.findUnique
        .mockResolvedValueOnce(initialCredential)
        .mockResolvedValueOnce(refreshedCredential);
      const refreshSpy = jest
        .spyOn(service, 'refreshCredentialToken')
        .mockResolvedValue(undefined);
      mockEncryption.decrypt.mockReturnValue('new-plain-token');

      const result = await service.getValidAccessToken('cred-1');

      expect(refreshSpy).toHaveBeenCalledWith('cred-1');
      expect(mockPrisma.credential.findUnique).toHaveBeenCalledTimes(2);
      expect(mockEncryption.decrypt).toHaveBeenCalledWith({
        encrypted: refreshedCredential.oauthAccessTokenEncrypted,
        iv: refreshedCredential.encryptionIv,
        authTag: refreshedCredential.authTag,
      });
      expect(result).toBe('new-plain-token');
    });

    it('throws "Failed to refresh token" when the post-refresh row still has no access token', async () => {
      const initialCredential = {
        id: 'cred-1',
        oauthExpiresAt: new Date(FIXED_NOW.getTime() + 4 * 60 * 1000),
        oauthAccessTokenEncrypted: Buffer.from('old-enc'),
        encryptionIv: Buffer.from('old-iv'),
        authTag: Buffer.from('old-tag'),
      };
      mockPrisma.credential.findUnique
        .mockResolvedValueOnce(initialCredential)
        .mockResolvedValueOnce({
          id: 'cred-1',
          oauthAccessTokenEncrypted: null,
        });
      jest
        .spyOn(service, 'refreshCredentialToken')
        .mockResolvedValue(undefined);

      await expect(service.getValidAccessToken('cred-1')).rejects.toThrow(
        'Failed to refresh token',
      );
      expect(mockEncryption.decrypt).not.toHaveBeenCalled();
    });
  });
});
