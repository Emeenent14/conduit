import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AppConfigService } from '../config/app-config.service';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
];

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

/**
 * Port of services/oauth/google.oauth.ts.
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private readonly config: AppConfigService) {}

  getAuthorizationUrl(state: string, scopes?: string[]): string {
    if (!this.config.oauth.google.enabled) {
      throw new Error('Google OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.oauth.google.clientId!,
      redirect_uri: this.config.oauth.google.callbackUrl!,
      response_type: 'code',
      scope: (scopes || DEFAULT_SCOPES).join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    if (!this.config.oauth.google.enabled) {
      throw new Error('Google OAuth is not configured');
    }

    try {
      const response = await axios.post(
        GOOGLE_TOKEN_URL,
        {
          code,
          client_id: this.config.oauth.google.clientId,
          client_secret: this.config.oauth.google.clientSecret,
          redirect_uri: this.config.oauth.google.callbackUrl,
          grant_type: 'authorization_code',
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      this.logger.log(
        'Successfully exchanged Google authorization code for tokens',
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to exchange Google authorization code: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error('Failed to obtain Google access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    if (!this.config.oauth.google.enabled) {
      throw new Error('Google OAuth is not configured');
    }

    try {
      const response = await axios.post(
        GOOGLE_TOKEN_URL,
        {
          refresh_token: refreshToken,
          client_id: this.config.oauth.google.clientId,
          client_secret: this.config.oauth.google.clientSecret,
          grant_type: 'refresh_token',
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      this.logger.log('Successfully refreshed Google access token');
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to refresh Google access token: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error('Failed to refresh Google access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get Google user info: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error('Failed to get Google user info');
    }
  }

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch {
      return false;
    }
  }
}
