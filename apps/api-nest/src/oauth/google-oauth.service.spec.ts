import axios from 'axios';
import { GoogleOAuthService } from './google-oauth.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe(GoogleOAuthService, () => {
  let mockConfig: any;
  let service: GoogleOAuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      oauth: {
        google: {
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
          callbackUrl: 'https://app.example.com/oauth/google/callback',
          enabled: true,
        },
      },
    };

    service = new GoogleOAuthService(mockConfig);
  });

  describe('getAuthorizationUrl', () => {
    it('throws without calling axios when Google OAuth is not configured', () => {
      mockConfig.oauth.google.enabled = false;

      expect(() => service.getAuthorizationUrl('state-123')).toThrow(
        'Google OAuth is not configured',
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns a URL with the default scopes and expected query params', () => {
      const url = service.getAuthorizationUrl('state-123');
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(parsed.searchParams.get('client_id')).toBe('google-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://app.example.com/oauth/google/callback',
      );
      expect(parsed.searchParams.get('state')).toBe('state-123');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('prompt')).toBe('consent');
      expect(parsed.searchParams.get('scope')).toBe(
        [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/spreadsheets',
        ].join(' '),
      );
    });

    it('returns a URL with custom scopes joined by spaces when provided', () => {
      const url = service.getAuthorizationUrl('state-123', [
        'scope-one',
        'scope-two',
      ]);
      const parsed = new URL(url);

      expect(parsed.searchParams.get('scope')).toBe('scope-one scope-two');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('throws without calling axios when Google OAuth is not configured', async () => {
      mockConfig.oauth.google.enabled = false;

      await expect(service.exchangeCodeForTokens('code')).rejects.toThrow(
        'Google OAuth is not configured',
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns response.data on the happy path', async () => {
      const tokens = {
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
        scope: 'a b',
        token_type: 'Bearer',
      };
      mockedAxios.post.mockResolvedValue({ data: tokens });

      const result = await service.exchangeCodeForTokens('auth-code');

      expect(result).toEqual(tokens);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          code: 'auth-code',
          client_id: 'google-client-id',
          client_secret: 'google-client-secret',
          redirect_uri: 'https://app.example.com/oauth/google/callback',
          grant_type: 'authorization_code',
        }),
        expect.anything(),
      );
    });

    it('wraps axios rejection as "Failed to obtain Google access token"', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network error'));

      await expect(service.exchangeCodeForTokens('auth-code')).rejects.toThrow(
        'Failed to obtain Google access token',
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('throws without calling axios when Google OAuth is not configured', async () => {
      mockConfig.oauth.google.enabled = false;

      await expect(service.refreshAccessToken('refresh')).rejects.toThrow(
        'Google OAuth is not configured',
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns response.data on the happy path', async () => {
      const tokens = {
        access_token: 'new-at',
        expires_in: 3600,
        scope: 'a b',
        token_type: 'Bearer',
      };
      mockedAxios.post.mockResolvedValue({ data: tokens });

      const result = await service.refreshAccessToken('refresh-token');

      expect(result).toEqual(tokens);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          refresh_token: 'refresh-token',
          client_id: 'google-client-id',
          client_secret: 'google-client-secret',
          grant_type: 'refresh_token',
        }),
        expect.anything(),
      );
    });

    it('wraps axios rejection as "Failed to refresh Google access token"', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network error'));

      await expect(service.refreshAccessToken('refresh-token')).rejects.toThrow(
        'Failed to refresh Google access token',
      );
    });
  });

  describe('getUserInfo', () => {
    it('returns response.data on the happy path', async () => {
      const userInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'User Name',
        given_name: 'User',
        family_name: 'Name',
        picture: 'https://example.com/pic.png',
      };
      mockedAxios.get.mockResolvedValue({ data: userInfo });

      const result = await service.getUserInfo('access-token');

      expect(result).toEqual(userInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        expect.objectContaining({
          headers: { Authorization: 'Bearer access-token' },
        }),
      );
    });

    it('wraps axios rejection as "Failed to get Google user info"', async () => {
      mockedAxios.get.mockRejectedValue(new Error('network error'));

      await expect(service.getUserInfo('access-token')).rejects.toThrow(
        'Failed to get Google user info',
      );
    });
  });

  describe('validateAccessToken', () => {
    it('returns true when getUserInfo resolves', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: '123' } });

      const result = await service.validateAccessToken('access-token');

      expect(result).toBe(true);
    });

    it('returns false when getUserInfo rejects', async () => {
      mockedAxios.get.mockRejectedValue(new Error('network error'));

      const result = await service.validateAccessToken('access-token');

      expect(result).toBe(false);
    });
  });
});
