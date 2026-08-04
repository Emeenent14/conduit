import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '../config/app-config.service';

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const SLACK_TEST_URL = 'https://slack.com/api/auth.test';

const DEFAULT_SCOPES = [
  'chat:write',
  'channels:read',
  'users:read',
  'files:write',
];

export interface SlackOAuthTokens {
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id: string;
  team: { id: string; name: string };
  enterprise?: { id: string; name: string };
  authed_user?: {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  };
}

export interface SlackAuthTest {
  ok: boolean;
  url: string;
  team: string;
  user: string;
  team_id: string;
  user_id: string;
  bot_id?: string;
  is_enterprise_install?: boolean;
}

/**
 * Port of services/oauth/slack.oauth.ts.
 *
 * Slack bot tokens do not expire and have no refresh token; if the app is
 * uninstalled the token is revoked. User tokens could need refreshing if
 * using OAuth 2.0 with refresh tokens, which is not implemented here (it
 * wasn't in the Express version either).
 */
@Injectable()
export class SlackOAuthService {
  private readonly logger = new Logger(SlackOAuthService.name);

  constructor(private readonly config: AppConfigService) {}

  getAuthorizationUrl(state: string, scopes?: string[]): string {
    if (!this.config.oauth.slack.enabled) {
      throw new Error('Slack OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.oauth.slack.clientId!,
      redirect_uri: this.config.oauth.slack.callbackUrl!,
      scope: (scopes || DEFAULT_SCOPES).join(','),
      state,
      user_scope: 'identity.basic,identity.email',
    });

    return `${SLACK_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SlackOAuthTokens> {
    if (!this.config.oauth.slack.enabled) {
      throw new Error('Slack OAuth is not configured');
    }

    try {
      const response = await axios.post(SLACK_TOKEN_URL, null, {
        params: {
          code,
          client_id: this.config.oauth.slack.clientId,
          client_secret: this.config.oauth.slack.clientSecret,
          redirect_uri: this.config.oauth.slack.callbackUrl,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Unknown Slack OAuth error');
      }

      this.logger.log(
        `Successfully exchanged Slack authorization code for tokens (team: ${response.data.team?.name})`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to exchange Slack authorization code: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error('Failed to obtain Slack access token');
    }
  }

  async testAccessToken(accessToken: string): Promise<SlackAuthTest> {
    try {
      const response = await axios.post(SLACK_TEST_URL, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Token test failed');
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to test Slack access token: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error('Failed to test Slack access token');
    }
  }

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const result = await this.testAccessToken(accessToken);
      return result.ok;
    } catch {
      return false;
    }
  }
}
