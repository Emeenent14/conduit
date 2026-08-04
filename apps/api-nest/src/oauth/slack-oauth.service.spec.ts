import axios from 'axios';
import { SlackOAuthService } from './slack-oauth.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe(SlackOAuthService, () => {
  let mockConfig: any;
  let service: SlackOAuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      oauth: {
        slack: {
          clientId: 'slack-client-id',
          clientSecret: 'slack-client-secret',
          callbackUrl: 'https://app.example.com/oauth/slack/callback',
          enabled: true,
        },
      },
    };

    service = new SlackOAuthService(mockConfig);
  });

  describe('getAuthorizationUrl', () => {
    it('throws without calling axios when Slack OAuth is not configured', () => {
      mockConfig.oauth.slack.enabled = false;

      expect(() => service.getAuthorizationUrl('state-123')).toThrow(
        'Slack OAuth is not configured',
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns a URL with the default scopes and expected query params', () => {
      const url = service.getAuthorizationUrl('state-123');
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe(
        'https://slack.com/oauth/v2/authorize',
      );
      expect(parsed.searchParams.get('client_id')).toBe('slack-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://app.example.com/oauth/slack/callback',
      );
      expect(parsed.searchParams.get('state')).toBe('state-123');
      expect(parsed.searchParams.get('scope')).toBe(
        ['chat:write', 'channels:read', 'users:read', 'files:write'].join(','),
      );
      expect(parsed.searchParams.get('user_scope')).toBe(
        'identity.basic,identity.email',
      );
    });

    it('returns a URL with custom scopes joined by commas when provided', () => {
      const url = service.getAuthorizationUrl('state-123', [
        'scope-one',
        'scope-two',
      ]);
      const parsed = new URL(url);

      expect(parsed.searchParams.get('scope')).toBe('scope-one,scope-two');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('throws without calling axios when Slack OAuth is not configured', async () => {
      mockConfig.oauth.slack.enabled = false;

      await expect(service.exchangeCodeForTokens('code')).rejects.toThrow(
        'Slack OAuth is not configured',
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns response.data on the happy path', async () => {
      const tokens = {
        access_token: 'at',
        token_type: 'Bearer',
        scope: 'chat:write,channels:read',
        app_id: 'app-1',
        team: { id: 'team-1', name: 'Team One' },
      };
      mockedAxios.post.mockResolvedValue({ data: { ok: true, ...tokens } });

      const result = await service.exchangeCodeForTokens('auth-code');

      expect(result).toEqual({ ok: true, ...tokens });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://slack.com/api/oauth.v2.access',
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            code: 'auth-code',
            client_id: 'slack-client-id',
            client_secret: 'slack-client-secret',
            redirect_uri: 'https://app.example.com/oauth/slack/callback',
          }),
        }),
      );
    });

    it('wraps axios rejection as "Failed to obtain Slack access token"', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network error'));

      await expect(service.exchangeCodeForTokens('auth-code')).rejects.toThrow(
        'Failed to obtain Slack access token',
      );
    });

    it('wraps a successful-but-ok:false response as "Failed to obtain Slack access token"', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: false, error: 'invalid_code' },
      });

      await expect(service.exchangeCodeForTokens('auth-code')).rejects.toThrow(
        'Failed to obtain Slack access token',
      );
    });
  });

  describe('testAccessToken', () => {
    it('returns response.data on the happy path', async () => {
      const authTest = {
        ok: true,
        url: 'https://team.slack.com/',
        team: 'Team One',
        user: 'bot',
        team_id: 'team-1',
        user_id: 'user-1',
      };
      mockedAxios.post.mockResolvedValue({ data: authTest });

      const result = await service.testAccessToken('access-token');

      expect(result).toEqual(authTest);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://slack.com/api/auth.test',
        null,
        expect.objectContaining({
          headers: { Authorization: 'Bearer access-token' },
        }),
      );
    });

    it('throws "Failed to test Slack access token" when response.data.ok is false', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: false, error: 'invalid_auth' },
      });

      await expect(service.testAccessToken('access-token')).rejects.toThrow(
        'Failed to test Slack access token',
      );
    });

    it('wraps axios rejection as "Failed to test Slack access token"', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network error'));

      await expect(service.testAccessToken('access-token')).rejects.toThrow(
        'Failed to test Slack access token',
      );
    });
  });

  describe('validateAccessToken', () => {
    it('returns true when testAccessToken resolves', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      const result = await service.validateAccessToken('access-token');

      expect(result).toBe(true);
    });

    it('returns false when testAccessToken rejects', async () => {
      mockedAxios.post.mockRejectedValue(new Error('network error'));

      const result = await service.validateAccessToken('access-token');

      expect(result).toBe(false);
    });

    it('returns false when testAccessToken resolves with ok:false', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { ok: false, error: 'invalid_auth' },
      });

      const result = await service.validateAccessToken('access-token');

      expect(result).toBe(false);
    });
  });
});
