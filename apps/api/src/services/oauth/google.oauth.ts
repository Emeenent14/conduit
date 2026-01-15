import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../lib/logger';

// ============================================
// Google OAuth Configuration
// ============================================

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo';

// Default scopes for Google OAuth
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
];

// ============================================
// Types
// ============================================

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

// ============================================
// Google OAuth Service
// ============================================

/**
 * Generate Google OAuth authorization URL
 */
export function getAuthorizationUrl(state: string, scopes?: string[]): string {
  if (!config.oauth.google.enabled) {
    throw new Error('Google OAuth is not configured');
  }

  const scopeList = scopes || DEFAULT_SCOPES;

  const params = new URLSearchParams({
    client_id: config.oauth.google.clientId!,
    redirect_uri: config.oauth.google.callbackUrl!,
    response_type: 'code',
    scope: scopeList.join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
  if (!config.oauth.google.enabled) {
    throw new Error('Google OAuth is not configured');
  }

  try {
    const response = await axios.post(
      GOOGLE_TOKEN_URL,
      {
        code,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        redirect_uri: config.oauth.google.callbackUrl,
        grant_type: 'authorization_code',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    logger.info('Successfully exchanged Google authorization code for tokens');
    return response.data;
  } catch (error: any) {
    logger.error('Failed to exchange Google authorization code', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to obtain Google access token');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  if (!config.oauth.google.enabled) {
    throw new Error('Google OAuth is not configured');
  }

  try {
    const response = await axios.post(
      GOOGLE_TOKEN_URL,
      {
        refresh_token: refreshToken,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        grant_type: 'refresh_token',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    logger.info('Successfully refreshed Google access token');
    return response.data;
  } catch (error: any) {
    logger.error('Failed to refresh Google access token', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to refresh Google access token');
  }
}

/**
 * Get user info from Google using access token
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get Google user info', {
      error: error.response?.data || error.message,
    });
    throw new Error('Failed to get Google user info');
  }
}

/**
 * Validate access token by making a test API call
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    await getUserInfo(accessToken);
    return true;
  } catch {
    return false;
  }
}
