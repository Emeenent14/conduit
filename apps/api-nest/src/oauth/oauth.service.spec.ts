import { OAuthService } from './oauth.service';

function encodeState(state: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

function decodeState(state: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
}

describe(OAuthService, () => {
  let mockPrisma: any;
  let mockConfig: any;
  let mockEncryption: any;
  let mockGoogleOAuth: any;
  let mockSlackOAuth: any;
  let mockN8nCredentialService: any;
  let service: OAuthService;

  const encryptedPayload = {
    encrypted: Buffer.from('encrypted-creds'),
    iv: Buffer.from('iv'),
    authTag: Buffer.from('tag'),
  };
  const accessTokenEncrypted = {
    encrypted: Buffer.from('encrypted-access'),
    iv: Buffer.from('access-iv'),
    authTag: Buffer.from('access-tag'),
  };
  const refreshTokenEncrypted = {
    encrypted: Buffer.from('encrypted-refresh'),
    iv: Buffer.from('refresh-iv'),
    authTag: Buffer.from('refresh-tag'),
  };

  beforeEach(() => {
    mockPrisma = {
      app: {
        findUnique: jest.fn(),
      },
      credential: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockConfig = {
      frontendUrl: 'https://frontend.example.com',
    };

    mockEncryption = {
      encryptJson: jest.fn().mockReturnValue(encryptedPayload),
      encrypt: jest.fn().mockImplementation((value: string) => {
        if (value === 'refresh-token-value') {
          return refreshTokenEncrypted;
        }
        return accessTokenEncrypted;
      }),
      toStorageFormat: jest.fn().mockReturnValue({
        credentialsEncrypted: encryptedPayload.encrypted,
        encryptionIv: encryptedPayload.iv,
        authTag: encryptedPayload.authTag,
      }),
    };

    mockGoogleOAuth = {
      getAuthorizationUrl: jest.fn().mockReturnValue('https://google-auth-url'),
      exchangeCodeForTokens: jest.fn(),
      getUserInfo: jest.fn(),
    };

    mockSlackOAuth = {
      getAuthorizationUrl: jest.fn().mockReturnValue('https://slack-auth-url'),
      exchangeCodeForTokens: jest.fn(),
    };

    mockN8nCredentialService = {
      syncCredentialToN8n: jest.fn().mockResolvedValue('synced'),
    };

    service = new OAuthService(
      mockPrisma,
      mockConfig,
      mockEncryption,
      mockGoogleOAuth,
      mockSlackOAuth,
      mockN8nCredentialService,
    );
  });

  describe('googleAuthorizeUrl', () => {
    it('calls googleOAuth.getAuthorizationUrl with a state encoding userId/provider/returnUrl', () => {
      const result = service.googleAuthorizeUrl(
        'user-1',
        'https://custom-return',
      );

      expect(result).toBe('https://google-auth-url');
      expect(mockGoogleOAuth.getAuthorizationUrl).toHaveBeenCalledTimes(1);
      const state = mockGoogleOAuth.getAuthorizationUrl.mock.calls[0][0];
      const decoded = decodeState(state);

      expect(decoded.userId).toBe('user-1');
      expect(decoded.provider).toBe('google');
      expect(decoded.returnUrl).toBe('https://custom-return');
      expect(typeof decoded.timestamp).toBe('number');
    });

    it('defaults returnUrl to `${frontendUrl}/credentials` when not provided', () => {
      service.googleAuthorizeUrl('user-1');

      const state = mockGoogleOAuth.getAuthorizationUrl.mock.calls[0][0];
      const decoded = decodeState(state);

      expect(decoded.returnUrl).toBe(
        'https://frontend.example.com/credentials',
      );
    });
  });

  describe('slackAuthorizeUrl', () => {
    it('calls slackOAuth.getAuthorizationUrl with a state encoding userId/provider/returnUrl', () => {
      const result = service.slackAuthorizeUrl(
        'user-1',
        'https://custom-return',
      );

      expect(result).toBe('https://slack-auth-url');
      expect(mockSlackOAuth.getAuthorizationUrl).toHaveBeenCalledTimes(1);
      const state = mockSlackOAuth.getAuthorizationUrl.mock.calls[0][0];
      const decoded = decodeState(state);

      expect(decoded.userId).toBe('user-1');
      expect(decoded.provider).toBe('slack');
      expect(decoded.returnUrl).toBe('https://custom-return');
    });

    it('defaults returnUrl to `${frontendUrl}/credentials` when not provided', () => {
      service.slackAuthorizeUrl('user-1');

      const state = mockSlackOAuth.getAuthorizationUrl.mock.calls[0][0];
      const decoded = decodeState(state);

      expect(decoded.returnUrl).toBe(
        'https://frontend.example.com/credentials',
      );
    });
  });

  describe('handleGoogleCallback', () => {
    const validState = () =>
      encodeState({
        userId: 'user-1',
        provider: 'google',
        timestamp: Date.now(),
        returnUrl: 'https://frontend.example.com/credentials',
      });

    const tokens = {
      access_token: 'google-access-token',
      refresh_token: 'refresh-token-value',
      expires_in: 3600,
      scope: 'scope-one scope-two',
      token_type: 'Bearer',
    };

    const userInfo = {
      id: 'google-user-1',
      email: 'user@example.com',
      verified_email: true,
      name: 'Some User',
      given_name: 'Some',
      family_name: 'User',
      picture: 'https://example.com/pic.png',
    };

    beforeEach(() => {
      mockGoogleOAuth.exchangeCodeForTokens.mockResolvedValue(tokens);
      mockGoogleOAuth.getUserInfo.mockResolvedValue(userInfo);
      mockPrisma.app.findUnique.mockResolvedValue({
        id: 'app-google',
        slug: 'google',
      });
    });

    it('creates a new credential when none exists, encoding tokens/expiry/scopes', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      mockPrisma.credential.create.mockResolvedValue({ id: 'credential-1' });

      const before = Date.now();
      const result = await service.handleGoogleCallback(
        'auth-code',
        validState(),
      );
      const after = Date.now();

      expect(mockPrisma.credential.create).toHaveBeenCalledTimes(1);
      const createArgs = mockPrisma.credential.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe('user-1');
      expect(createArgs.data.appId).toBe('app-google');
      expect(createArgs.data.oauthAccessTokenEncrypted).toBe(
        accessTokenEncrypted.encrypted,
      );
      expect(createArgs.data.oauthRefreshTokenEncrypted).toBe(
        refreshTokenEncrypted.encrypted,
      );
      expect(createArgs.data.oauthScopes).toEqual(['scope-one', 'scope-two']);
      expect(createArgs.data.oauthExpiresAt.getTime()).toBeGreaterThanOrEqual(
        before + tokens.expires_in * 1000,
      );
      expect(createArgs.data.oauthExpiresAt.getTime()).toBeLessThanOrEqual(
        after + tokens.expires_in * 1000,
      );

      expect(mockPrisma.credential.update).not.toHaveBeenCalled();
      expect(result).toBe(
        'https://frontend.example.com/credentials?success=true&provider=google',
      );
    });

    it('updates the existing credential when one is found', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'existing-credential-1',
      });
      mockPrisma.credential.update.mockResolvedValue({
        id: 'existing-credential-1',
      });

      await service.handleGoogleCallback('auth-code', validState());

      expect(mockPrisma.credential.create).not.toHaveBeenCalled();
      expect(mockPrisma.credential.update).toHaveBeenCalledTimes(1);
      const updateArgs = mockPrisma.credential.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 'existing-credential-1' });
      expect(updateArgs.data.oauthScopes).toEqual(['scope-one', 'scope-two']);
    });

    it('fires-and-forgets syncCredentialToN8n: a rejection there does not reject handleGoogleCallback', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      mockPrisma.credential.create.mockResolvedValue({ id: 'credential-1' });
      mockN8nCredentialService.syncCredentialToN8n.mockRejectedValue(
        new Error('n8n sync failed'),
      );

      await expect(
        service.handleGoogleCallback('auth-code', validState()),
      ).resolves.toBe(
        'https://frontend.example.com/credentials?success=true&provider=google',
      );

      expect(mockN8nCredentialService.syncCredentialToN8n).toHaveBeenCalledWith(
        'credential-1',
      );
    });

    it('throws "Invalid OAuth state parameter" for a garbage state param', async () => {
      await expect(
        service.handleGoogleCallback('auth-code', 'not-base64-json'),
      ).rejects.toThrow('Invalid OAuth state parameter');

      expect(mockGoogleOAuth.exchangeCodeForTokens).not.toHaveBeenCalled();
    });

    it('throws a distinct "OAuth state has expired" message for a validly-encoded but stale state', async () => {
      const staleState = encodeState({
        userId: 'user-1',
        provider: 'google',
        timestamp: Date.now() - 16 * 60 * 1000,
        returnUrl: 'https://frontend.example.com/credentials',
      });

      await expect(
        service.handleGoogleCallback('auth-code', staleState),
      ).rejects.toThrow('OAuth state has expired');

      expect(mockGoogleOAuth.exchangeCodeForTokens).not.toHaveBeenCalled();
    });
  });

  describe('handleSlackCallback', () => {
    const validState = () =>
      encodeState({
        userId: 'user-1',
        provider: 'slack',
        timestamp: Date.now(),
        returnUrl: 'https://frontend.example.com/credentials',
      });

    const tokens = {
      access_token: 'slack-access-token',
      token_type: 'Bearer',
      scope: 'chat:write,channels:read',
      app_id: 'app-1',
      team: { id: 'team-1', name: 'Team One' },
      bot_user_id: 'bot-1',
    };

    beforeEach(() => {
      mockSlackOAuth.exchangeCodeForTokens.mockResolvedValue(tokens);
      mockPrisma.app.findUnique.mockResolvedValue({
        id: 'app-slack',
        slug: 'slack',
      });
    });

    it('creates a new credential when none exists, splitting scopes on commas with no oauthExpiresAt/refresh token', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      mockPrisma.credential.create.mockResolvedValue({ id: 'credential-2' });

      const result = await service.handleSlackCallback(
        'auth-code',
        validState(),
      );

      expect(mockPrisma.credential.create).toHaveBeenCalledTimes(1);
      const createArgs = mockPrisma.credential.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe('user-1');
      expect(createArgs.data.appId).toBe('app-slack');
      expect(createArgs.data.oauthScopes).toEqual([
        'chat:write',
        'channels:read',
      ]);
      expect(createArgs.data.oauthAccessTokenEncrypted).toBe(
        accessTokenEncrypted.encrypted,
      );
      expect(createArgs.data.oauthRefreshTokenEncrypted).toBeUndefined();
      expect(createArgs.data.oauthExpiresAt).toBeUndefined();

      expect(mockPrisma.credential.update).not.toHaveBeenCalled();
      expect(result).toBe(
        'https://frontend.example.com/credentials?success=true&provider=slack',
      );
    });

    it('updates the existing credential when one is found', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue({
        id: 'existing-credential-2',
      });
      mockPrisma.credential.update.mockResolvedValue({
        id: 'existing-credential-2',
      });

      await service.handleSlackCallback('auth-code', validState());

      expect(mockPrisma.credential.create).not.toHaveBeenCalled();
      expect(mockPrisma.credential.update).toHaveBeenCalledTimes(1);
      const updateArgs = mockPrisma.credential.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 'existing-credential-2' });
      expect(updateArgs.data.oauthScopes).toEqual([
        'chat:write',
        'channels:read',
      ]);
    });

    it('fires-and-forgets syncCredentialToN8n: a rejection there does not reject handleSlackCallback', async () => {
      mockPrisma.credential.findUnique.mockResolvedValue(null);
      mockPrisma.credential.create.mockResolvedValue({ id: 'credential-2' });
      mockN8nCredentialService.syncCredentialToN8n.mockRejectedValue(
        new Error('n8n sync failed'),
      );

      await expect(
        service.handleSlackCallback('auth-code', validState()),
      ).resolves.toBe(
        'https://frontend.example.com/credentials?success=true&provider=slack',
      );

      expect(mockN8nCredentialService.syncCredentialToN8n).toHaveBeenCalledWith(
        'credential-2',
      );
    });

    it('throws "Invalid OAuth state parameter" for a garbage state param', async () => {
      await expect(
        service.handleSlackCallback('auth-code', 'not-base64-json'),
      ).rejects.toThrow('Invalid OAuth state parameter');

      expect(mockSlackOAuth.exchangeCodeForTokens).not.toHaveBeenCalled();
    });

    it('throws a distinct "OAuth state has expired" message for a validly-encoded but stale state', async () => {
      const staleState = encodeState({
        userId: 'user-1',
        provider: 'slack',
        timestamp: Date.now() - 16 * 60 * 1000,
        returnUrl: 'https://frontend.example.com/credentials',
      });

      await expect(
        service.handleSlackCallback('auth-code', staleState),
      ).rejects.toThrow('OAuth state has expired');

      expect(mockSlackOAuth.exchangeCodeForTokens).not.toHaveBeenCalled();
    });
  });
});
