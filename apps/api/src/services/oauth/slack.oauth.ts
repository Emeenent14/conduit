import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../lib/logger';

// ============================================
// Slack OAuth Configuration
// ============================================

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const SLACK_TEST_URL = 'https://slack.com/api/auth.test';

// Default scopes for Slack OAuth
const DEFAULT_SCOPES = [
  'chat:write',
  'channels:read',
  'users:read',
  'files:write',
];

// ============================================
// Types
// ============================================

export interface SlackOAuthTokens {
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
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

// ============================================
// Slack OAuth Service
// ============================================

/**
 * Generate Slack OAuth authorization URL
 */
export function getAuthorizationUrl(state: string, scopes?: string[]): string {
  if (!config.oauth.slack.enabled) {
    throw new Error('Slack OAuth is not configured');
  }

  const scopeList = scopes || DEFAULT_SCOPES;

  const params = new URLSearchParams({
    client_id: config.oauth.slack.clientId!,
    redirect_uri: config.oauth.slack.callbackUrl!,
    scope: scopeList.join(','),
    state,
    // Request user token in addition to bot token
    user_scope: 'identity.basic,identity.email',
  });

  return `${SLACK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<SlackOAuthTokens> {
  if (!config.oauth.slack.enabled) {
    throw new Error('Slack OAuth is not configured');
  }

  try {
    const response = await axios.post(
      SLACK_TOKEN_URL,
      null,
      {
        params: {
          code,
          client_id: config.oauth.slack.clientId,
          client_secret: config.oauth.slack.clientSecret,
          redirect_uri: config.oauth.slack.callbackUrl,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.error || 'Unknown Slack OAuth error');
    }

    logger.info('Successfully exchanged Slack authorization code for tokens', {
      team: response.data.team?.name,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to exchange Slack authorization code', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to obtain Slack access token');
  }
}

/**
 * Test Slack access token
 */
export async function testAccessToken(accessToken: string): Promise<SlackAuthTest> {
  try {
    const response = await axios.post(
      SLACK_TEST_URL,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.error || 'Token test failed');
    }

    return response.data;
  } catch (error: any) {
    logger.error('Failed to test Slack access token', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to test Slack access token');
  }
}

/**
 * Validate access token
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const result = await testAccessToken(accessToken);
    return result.ok;
  } catch {
    return false;
  }
}

/**
 * Note: Slack Bot tokens do not expire and do not have refresh tokens.
 * If the app is uninstalled, the token will be revoked.
 * User tokens may need to be refreshed if using OAuth 2.0 with refresh tokens.
 */
