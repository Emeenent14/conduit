import { CredentialsService } from './credentials.service';

describe(CredentialsService, () => {
  let service: CredentialsService;
  let mockPrisma: {
    credential: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
    app: {
      findUnique: jest.Mock;
    };
  };
  let mockEncryption: {
    encryptJson: jest.Mock;
    decryptJson: jest.Mock;
    toStorageFormat: jest.Mock;
    fromStorageFormat: jest.Mock;
    decrypt: jest.Mock;
  };
  let mockN8nClient: {
    deleteCredential: jest.Mock;
  };

  const APP = {
    id: 'app-1',
    slug: 'openai',
    name: 'OpenAI',
    iconUrl: null,
    authType: 'api_key',
  };

  beforeEach(() => {
    mockPrisma = {
      credential: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      app: {
        findUnique: jest.fn(),
      },
    };
    mockEncryption = {
      encryptJson: jest.fn(),
      decryptJson: jest.fn(),
      toStorageFormat: jest.fn(),
      fromStorageFormat: jest.fn(),
      decrypt: jest.fn(),
    };
    mockN8nClient = {
      deleteCredential: jest.fn(),
    };

    service = new CredentialsService(
      mockPrisma as any,
      mockEncryption as any,
      mockN8nClient as any,
    );
  });

  describe('listUserCredentials', () => {
    it('maps Prisma rows to the CredentialData shape', async () => {
      const now = new Date();
      mockPrisma.credential.findMany.mockResolvedValue([
        {
          id: 'cred-1',
          userId: 'user-1',
          app: APP,
          isValid: true,
          lastValidatedAt: now,
          validationError: null,
          createdAt: now,
          updatedAt: now,
          oauthExpiresAt: null,
          oauthScopes: ['scope-a'],
          n8nCredentialId: 'n8n-1',
        },
      ]);

      const result = await service.listUserCredentials('user-1');

      expect(mockPrisma.credential.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { app: { select: expect.any(Object) } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([
        {
          id: 'cred-1',
          userId: 'user-1',
          app: APP,
          isValid: true,
          lastValidatedAt: now,
          validationError: null,
          createdAt: now,
          updatedAt: now,
          oauthExpiresAt: null,
          oauthScopes: ['scope-a'],
          n8nCredentialId: 'n8n-1',
        },
      ]);
    });

    it('returns an empty array when there are no credentials', async () => {
      mockPrisma.credential.findMany.mockResolvedValue([]);

      const result = await service.listUserCredentials('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getCredentialById', () => {
    it('returns the mapped credential when found', async () => {
      const now = new Date();
      mockPrisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        userId: 'user-1',
        app: APP,
        isValid: true,
        lastValidatedAt: null,
        validationError: null,
        createdAt: now,
        updatedAt: now,
        oauthExpiresAt: null,
        oauthScopes: [],
        n8nCredentialId: null,
      });

      const result = await service.getCredentialById('cred-1', 'user-1');

      expect(mockPrisma.credential.findFirst).toHaveBeenCalledWith({
        where: { id: 'cred-1', userId: 'user-1' },
        include: { app: { select: expect.any(Object) } },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('cred-1');
    });

    it('returns null (does not throw) when not found', async () => {
      mockPrisma.credential.findFirst.mockResolvedValue(null);

      const result = await service.getCredentialById('missing', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('createApiKeyCredential', () => {
    const input = {
      userId: 'user-1',
      appSlug: 'openai',
      apiKey: 'sk-test',
      name: 'My Key',
    };

    it('encrypts and creates the credential on the happy path', async () => {
      mockPrisma.app.findUnique.mockResolvedValue(APP);
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      const encryptedData = { encrypted: 'enc', iv: 'iv', authTag: 'tag' };
      mockEncryption.encryptJson.mockReturnValue(encryptedData);
      const storageFormat = {
        credentialsEncrypted: 'enc',
        encryptionIv: 'iv',
        authTag: 'tag',
      };
      mockEncryption.toStorageFormat.mockReturnValue(storageFormat);
      const now = new Date();
      mockPrisma.credential.create.mockResolvedValue({
        id: 'cred-new',
        userId: 'user-1',
        app: APP,
        isValid: true,
        lastValidatedAt: null,
        validationError: null,
        createdAt: now,
        updatedAt: now,
        n8nCredentialId: null,
      });

      const result = await service.createApiKeyCredential(input);

      expect(mockPrisma.app.findUnique).toHaveBeenCalledWith({
        where: { slug: 'openai' },
      });
      expect(mockPrisma.credential.findUnique).toHaveBeenCalledWith({
        where: { userId_appId: { userId: 'user-1', appId: APP.id } },
      });
      expect(mockEncryption.encryptJson).toHaveBeenCalledWith({
        apiKey: 'sk-test',
        name: 'My Key',
      });
      expect(mockEncryption.toStorageFormat).toHaveBeenCalledWith(
        encryptedData,
      );
      expect(mockPrisma.credential.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          appId: APP.id,
          ...storageFormat,
          isValid: true,
        },
        include: { app: { select: expect.any(Object) } },
      });
      expect(result.id).toBe('cred-new');
    });

    it('defaults the credential name when none is provided', async () => {
      mockPrisma.app.findUnique.mockResolvedValue(APP);
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      mockEncryption.encryptJson.mockReturnValue({});
      mockEncryption.toStorageFormat.mockReturnValue({});
      mockPrisma.credential.create.mockResolvedValue({
        id: 'cred-new',
        userId: 'user-1',
        app: APP,
        isValid: true,
        lastValidatedAt: null,
        validationError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        n8nCredentialId: null,
      });

      await service.createApiKeyCredential({
        userId: 'user-1',
        appSlug: 'openai',
        apiKey: 'sk-test',
      });

      expect(mockEncryption.encryptJson).toHaveBeenCalledWith({
        apiKey: 'sk-test',
        name: `${APP.name} API Key`,
      });
    });

    it('throws when the app is not found', async () => {
      mockPrisma.app.findUnique.mockResolvedValue(null);

      await expect(service.createApiKeyCredential(input)).rejects.toThrow(
        'App not found: openai',
      );
    });

    it('throws when the app does not support API key authentication', async () => {
      mockPrisma.app.findUnique.mockResolvedValue({
        ...APP,
        authType: 'oauth2',
      });

      await expect(service.createApiKeyCredential(input)).rejects.toThrow(
        'App openai does not support API key authentication',
      );
    });

    it('throws when the user already has a credential for the app', async () => {
      mockPrisma.app.findUnique.mockResolvedValue(APP);
      mockPrisma.credential.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.createApiKeyCredential(input)).rejects.toThrow(
        `You already have a credential for ${APP.name}`,
      );
    });
  });

  describe('deleteCredential', () => {
    it('deletes the credential and calls n8nClient.deleteCredential when n8nCredentialId is set', async () => {
      mockPrisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        userId: 'user-1',
        n8nCredentialId: 'n8n-1',
      });
      mockN8nClient.deleteCredential.mockResolvedValue(undefined);
      mockPrisma.credential.delete.mockResolvedValue({});

      await service.deleteCredential('cred-1', 'user-1');

      expect(mockN8nClient.deleteCredential).toHaveBeenCalledWith('n8n-1');
      expect(mockPrisma.credential.delete).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
      });
    });

    it('does not call n8nClient.deleteCredential when n8nCredentialId is not set', async () => {
      mockPrisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        userId: 'user-1',
        n8nCredentialId: null,
      });
      mockPrisma.credential.delete.mockResolvedValue({});

      await service.deleteCredential('cred-1', 'user-1');

      expect(mockN8nClient.deleteCredential).not.toHaveBeenCalled();
      expect(mockPrisma.credential.delete).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
      });
    });

    it('throws when the credential is not found', async () => {
      mockPrisma.credential.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteCredential('missing', 'user-1'),
      ).rejects.toThrow('Credential not found');
      expect(mockPrisma.credential.delete).not.toHaveBeenCalled();
    });

    it('swallows n8n delete failures and still deletes the Prisma row', async () => {
      mockPrisma.credential.findFirst.mockResolvedValue({
        id: 'cred-1',
        userId: 'user-1',
        n8nCredentialId: 'n8n-1',
      });
      mockN8nClient.deleteCredential.mockRejectedValue(
        new Error('n8n is down'),
      );
      mockPrisma.credential.delete.mockResolvedValue({});

      await expect(
        service.deleteCredential('cred-1', 'user-1'),
      ).resolves.toBeUndefined();

      expect(mockN8nClient.deleteCredential).toHaveBeenCalledWith('n8n-1');
      expect(mockPrisma.credential.delete).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
      });
    });
  });

  describe('getDecryptedAccessToken', () => {
    it('throws when the credential is not found', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);

      await expect(service.getDecryptedAccessToken('missing')).rejects.toThrow(
        'Credential not found',
      );
    });

    describe('oauth2 apps', () => {
      it('decrypts and returns the oauth access token', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue({
          app: { authType: 'oauth2' },
          oauthAccessTokenEncrypted: 'enc-token',
          encryptionIv: 'iv',
          authTag: 'tag',
        });
        mockEncryption.decrypt.mockReturnValue('plain-token');

        const result = await service.getDecryptedAccessToken('cred-1');

        expect(mockEncryption.decrypt).toHaveBeenCalledWith({
          encrypted: 'enc-token',
          iv: 'iv',
          authTag: 'tag',
        });
        expect(result).toBe('plain-token');
      });

      it('returns null when oauthAccessTokenEncrypted is null', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue({
          app: { authType: 'oauth2' },
          oauthAccessTokenEncrypted: null,
          encryptionIv: 'iv',
          authTag: 'tag',
        });

        const result = await service.getDecryptedAccessToken('cred-1');

        expect(result).toBeNull();
        expect(mockEncryption.decrypt).not.toHaveBeenCalled();
      });
    });

    describe('api_key apps', () => {
      it('decrypts and JSON-parses the credentials, returning apiKey', async () => {
        mockPrisma.credential.findUnique.mockResolvedValue({
          app: { authType: 'api_key' },
          credentialsEncrypted: 'enc',
          encryptionIv: 'iv',
          authTag: 'tag',
        });
        const fromStorage = { encrypted: 'enc', iv: 'iv', authTag: 'tag' };
        mockEncryption.fromStorageFormat.mockReturnValue(fromStorage);
        mockEncryption.decryptJson.mockReturnValue({ apiKey: 'sk-live' });

        const result = await service.getDecryptedAccessToken('cred-1');

        expect(mockEncryption.fromStorageFormat).toHaveBeenCalledWith({
          credentialsEncrypted: 'enc',
          encryptionIv: 'iv',
          authTag: 'tag',
        });
        expect(mockEncryption.decryptJson).toHaveBeenCalledWith(fromStorage);
        expect(result).toBe('sk-live');
      });
    });

    it('returns null for other auth types', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        app: { authType: 'basic' },
      });

      const result = await service.getDecryptedAccessToken('cred-1');

      expect(result).toBeNull();
    });
  });

  describe('markCredentialInvalid', () => {
    it('updates the credential as invalid with the error message', async () => {
      mockPrisma.credential.update.mockResolvedValue({});

      await service.markCredentialInvalid('cred-1', 'oops');

      expect(mockPrisma.credential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: {
          isValid: false,
          validationError: 'oops',
          lastValidatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markCredentialValid', () => {
    it('updates the credential as valid and clears the validation error', async () => {
      mockPrisma.credential.update.mockResolvedValue({});

      await service.markCredentialValid('cred-1');

      expect(mockPrisma.credential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: {
          isValid: true,
          validationError: null,
          lastValidatedAt: expect.any(Date),
        },
      });
    });
  });
});
