import { N8nCredentialService } from './n8n-credential.service';

describe(N8nCredentialService, () => {
  let mockPrisma: any;
  let mockEncryption: any;
  let mockConfig: any;
  let mockN8nClient: any;
  let service: N8nCredentialService;

  beforeEach(() => {
    mockPrisma = {
      credential: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    mockEncryption = {
      decrypt: jest.fn(),
      decryptJson: jest.fn(),
      fromStorageFormat: jest.fn((stored: any) => stored),
    };

    mockConfig = {
      oauth: {
        google: {
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
        },
      },
    };

    mockN8nClient = {
      createCredential: jest.fn(),
      deleteCredential: jest.fn(),
    };

    service = new N8nCredentialService(
      mockPrisma,
      mockEncryption,
      mockConfig,
      mockN8nClient,
    );
  });

  function buildGoogleCredential(overrides: any = {}) {
    return {
      id: 'cred-1',
      n8nCredentialId: null,
      credentialsEncrypted: Buffer.from('enc'),
      encryptionIv: Buffer.from('iv'),
      authTag: Buffer.from('tag'),
      oauthAccessTokenEncrypted: Buffer.from('access-enc'),
      oauthRefreshTokenEncrypted: Buffer.from('refresh-enc'),
      app: { slug: 'google', name: 'Google', authType: 'oauth2' },
      user: { name: 'Alice' },
      ...overrides,
    };
  }

  function buildOpenAiCredential(overrides: any = {}) {
    return {
      id: 'cred-2',
      n8nCredentialId: null,
      credentialsEncrypted: Buffer.from('enc'),
      encryptionIv: Buffer.from('iv'),
      authTag: Buffer.from('tag'),
      oauthAccessTokenEncrypted: null,
      oauthRefreshTokenEncrypted: null,
      app: { slug: 'openai', name: 'OpenAI', authType: 'api_key' },
      user: { name: 'Bob' },
      ...overrides,
    };
  }

  describe('syncCredentialToN8n', () => {
    it('syncs an oauth2 google credential: decrypts tokens, creates the n8n credential, and updates the row', async () => {
      const credential = buildGoogleCredential();
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({});
      mockEncryption.decrypt
        .mockReturnValueOnce('access-token-plain')
        .mockReturnValueOnce('refresh-token-plain');
      mockN8nClient.createCredential.mockResolvedValue({ id: 'n8n-cred-1' });
      mockPrisma.credential.update.mockResolvedValue({});

      const result = await service.syncCredentialToN8n('cred-1');

      expect(mockEncryption.decrypt).toHaveBeenCalledWith({
        encrypted: credential.oauthAccessTokenEncrypted,
        iv: credential.encryptionIv,
        authTag: credential.authTag,
      });
      expect(mockEncryption.decrypt).toHaveBeenCalledWith({
        encrypted: credential.oauthRefreshTokenEncrypted,
        iv: credential.encryptionIv,
        authTag: credential.authTag,
      });

      expect(mockN8nClient.createCredential).toHaveBeenCalledWith({
        name: 'Alice - Google',
        type: 'googleOAuth2Api',
        data: {
          accessToken: 'access-token-plain',
          refreshToken: 'refresh-token-plain',
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
          oauthTokenData: {
            access_token: 'access-token-plain',
            refresh_token: 'refresh-token-plain',
            token_type: 'Bearer',
          },
        },
      });

      expect(mockPrisma.credential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: { n8nCredentialId: 'n8n-cred-1' },
      });

      expect(result).toBe('n8n-cred-1');
      expect(mockN8nClient.deleteCredential).not.toHaveBeenCalled();
    });

    it('deletes the existing n8n credential first when one is already synced', async () => {
      const credential = buildGoogleCredential({
        n8nCredentialId: 'old-n8n-cred',
      });
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({});
      mockEncryption.decrypt
        .mockReturnValueOnce('access-token-plain')
        .mockReturnValueOnce('refresh-token-plain');
      mockN8nClient.deleteCredential.mockResolvedValue(undefined);
      mockN8nClient.createCredential.mockResolvedValue({ id: 'new-n8n-cred' });
      mockPrisma.credential.update.mockResolvedValue({});

      const result = await service.syncCredentialToN8n('cred-1');

      expect(mockN8nClient.deleteCredential).toHaveBeenCalledWith(
        'old-n8n-cred',
      );
      expect(result).toBe('new-n8n-cred');
    });

    it('swallows a failure deleting the old n8n credential and still proceeds with the sync', async () => {
      const credential = buildGoogleCredential({
        n8nCredentialId: 'old-n8n-cred',
      });
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({});
      mockEncryption.decrypt
        .mockReturnValueOnce('access-token-plain')
        .mockReturnValueOnce('refresh-token-plain');
      mockN8nClient.deleteCredential.mockRejectedValue(
        new Error('delete failed'),
      );
      mockN8nClient.createCredential.mockResolvedValue({ id: 'new-n8n-cred' });
      mockPrisma.credential.update.mockResolvedValue({});

      const result = await service.syncCredentialToN8n('cred-1');

      expect(mockN8nClient.deleteCredential).toHaveBeenCalledWith(
        'old-n8n-cred',
      );
      expect(mockN8nClient.createCredential).toHaveBeenCalled();
      expect(result).toBe('new-n8n-cred');
    });

    it('syncs an api_key openai credential via the openai formatting branch', async () => {
      const credential = buildOpenAiCredential();
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({ apiKey: 'sk-test-123' });
      mockN8nClient.createCredential.mockResolvedValue({
        id: 'n8n-cred-openai',
      });
      mockPrisma.credential.update.mockResolvedValue({});

      const result = await service.syncCredentialToN8n('cred-2');

      expect(mockN8nClient.createCredential).toHaveBeenCalledWith({
        name: 'Bob - OpenAI',
        type: 'openAiApi',
        data: { apiKey: 'sk-test-123' },
      });
      expect(result).toBe('n8n-cred-openai');
    });

    it('throws "Credential not found" (not wrapped) when the credential row does not exist', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);

      try {
        await service.syncCredentialToN8n('missing');
        fail('expected syncCredentialToN8n to throw');
      } catch (err) {
        expect((err as Error).message).toBe('Credential not found');
      }

      expect(mockN8nClient.createCredential).not.toHaveBeenCalled();
    });

    it('wraps an unmapped app slug error as "Failed to sync credential to n8n: ..."', async () => {
      const credential = buildGoogleCredential({
        app: { slug: 'unmapped-app', name: 'Unmapped', authType: 'oauth2' },
      });
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({});
      mockEncryption.decrypt
        .mockReturnValueOnce('access-token-plain')
        .mockReturnValueOnce('refresh-token-plain');

      await expect(service.syncCredentialToN8n('cred-1')).rejects.toThrow(
        'Failed to sync credential to n8n: No n8n credential type mapping found for app: unmapped-app',
      );

      expect(mockN8nClient.createCredential).not.toHaveBeenCalled();
    });

    it('wraps an unsupported authType error as "Failed to sync credential to n8n: ..."', async () => {
      const credential = buildGoogleCredential({
        app: { slug: 'google', name: 'Google', authType: 'basic' },
      });
      mockPrisma.credential.findUnique.mockResolvedValue(credential);
      mockEncryption.decryptJson.mockReturnValue({});

      await expect(service.syncCredentialToN8n('cred-1')).rejects.toThrow(
        'Failed to sync credential to n8n: Unsupported auth type: basic',
      );

      expect(mockN8nClient.createCredential).not.toHaveBeenCalled();
    });
  });

  describe('removeCredentialFromN8n', () => {
    it('deletes the n8n credential when the row has one', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        n8nCredentialId: 'n8n-cred-1',
      });
      mockN8nClient.deleteCredential.mockResolvedValue(undefined);

      await service.removeCredentialFromN8n('cred-1');

      expect(mockN8nClient.deleteCredential).toHaveBeenCalledWith('n8n-cred-1');
    });

    it('early-returns without calling n8n when there is no n8nCredentialId', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        n8nCredentialId: null,
      });

      await expect(
        service.removeCredentialFromN8n('cred-1'),
      ).resolves.toBeUndefined();

      expect(mockN8nClient.deleteCredential).not.toHaveBeenCalled();
    });

    it('early-returns without throwing when the credential row does not exist', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);

      await expect(
        service.removeCredentialFromN8n('missing'),
      ).resolves.toBeUndefined();

      expect(mockN8nClient.deleteCredential).not.toHaveBeenCalled();
    });

    it('does not throw when n8nClient.deleteCredential rejects', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        n8nCredentialId: 'n8n-cred-1',
      });
      mockN8nClient.deleteCredential.mockRejectedValue(
        new Error('n8n unreachable'),
      );

      await expect(
        service.removeCredentialFromN8n('cred-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('resyncCredentialToN8n', () => {
    it('delegates to syncCredentialToN8n', async () => {
      const syncSpy = jest
        .spyOn(service, 'syncCredentialToN8n')
        .mockResolvedValue('n8n-cred-1');

      await service.resyncCredentialToN8n('cred-1');

      expect(syncSpy).toHaveBeenCalledWith('cred-1');
    });
  });

  describe('syncAllUserCredentialsToN8n', () => {
    it('syncs each credential, counts only successes, and continues past a failure', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([
        { id: 'cred-1' },
        { id: 'cred-2' },
      ]);
      const syncSpy = jest
        .spyOn(service, 'syncCredentialToN8n')
        .mockRejectedValueOnce(new Error('sync failed'))
        .mockResolvedValueOnce('n8n-cred-2');

      const result = await service.syncAllUserCredentialsToN8n('user-1');

      expect(mockPrisma.credential.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(syncSpy).toHaveBeenCalledTimes(2);
      expect(syncSpy).toHaveBeenNthCalledWith(1, 'cred-1');
      expect(syncSpy).toHaveBeenNthCalledWith(2, 'cred-2');
      expect(result).toBe(1);
    });

    it('returns 0 when there are no credentials', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([]);
      const syncSpy = jest.spyOn(service, 'syncCredentialToN8n');

      const result = await service.syncAllUserCredentialsToN8n('user-1');

      expect(syncSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
