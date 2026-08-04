import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { AppConfigService } from '../config/app-config.service';
import { N8nCredentialService } from '../n8n/n8n-credential.service';
import { GoogleOAuthService } from './google-oauth.service';
import { SlackOAuthService } from './slack-oauth.service';

interface OAuthState {
  userId: string;
  provider: string;
  timestamp: number;
  returnUrl?: string;
}

/**
 * Port of controllers/oauth.controller.ts's business logic (app-credential
 * connect flows, distinct from login). Redirect assembly stays in the
 * controller; this service owns state encoding and token exchange/storage.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly encryption: EncryptionService,
    private readonly googleOAuth: GoogleOAuthService,
    private readonly slackOAuth: SlackOAuthService,
    private readonly n8nCredentialService: N8nCredentialService,
  ) {}

  private generateState(
    userId: string,
    provider: string,
    returnUrl?: string,
  ): string {
    const state: OAuthState = {
      userId,
      provider,
      timestamp: Date.now(),
      returnUrl,
    };
    return Buffer.from(JSON.stringify(state)).toString('base64url');
  }

  private parseState(stateParam: string): OAuthState {
    try {
      const state: OAuthState = JSON.parse(
        Buffer.from(stateParam, 'base64url').toString('utf8'),
      );

      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      if (state.timestamp < fifteenMinutesAgo) {
        throw new Error('OAuth state has expired');
      }

      return state;
    } catch {
      throw new Error('Invalid OAuth state parameter');
    }
  }

  private async getAppByProvider(provider: string) {
    const providerMap: Record<string, string> = {
      google: 'google',
      slack: 'slack',
    };
    const appSlug = providerMap[provider];
    if (!appSlug) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    const app = await this.prisma.app.findUnique({ where: { slug: appSlug } });
    if (!app) {
      throw new Error(`App not found for provider: ${provider}`);
    }

    return app;
  }

  googleAuthorizeUrl(userId: string, returnUrl?: string): string {
    const url = returnUrl || `${this.config.frontendUrl}/credentials`;
    const state = this.generateState(userId, 'google', url);
    return this.googleOAuth.getAuthorizationUrl(state);
  }

  slackAuthorizeUrl(userId: string, returnUrl?: string): string {
    const url = returnUrl || `${this.config.frontendUrl}/credentials`;
    const state = this.generateState(userId, 'slack', url);
    return this.slackOAuth.getAuthorizationUrl(state);
  }

  async handleGoogleCallback(
    code: string,
    stateParam: string,
  ): Promise<string> {
    const { userId, returnUrl } = this.parseState(stateParam);

    const tokens = await this.googleOAuth.exchangeCodeForTokens(code);
    const userInfo = await this.googleOAuth.getUserInfo(tokens.access_token);
    const app = await this.getAppByProvider('google');

    const existingCredential = await this.prisma.credential.findUnique({
      where: { userId_appId: { userId, appId: app.id } },
    });

    const credentialsData = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
    const encryptedCreds = this.encryption.encryptJson(credentialsData);
    const accessTokenEncrypted = this.encryption.encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token
      ? this.encryption.encrypt(tokens.refresh_token)
      : null;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    let credentialId: string;

    if (existingCredential) {
      await this.prisma.credential.update({
        where: { id: existingCredential.id },
        data: {
          ...this.encryption.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          oauthRefreshTokenEncrypted: refreshTokenEncrypted?.encrypted || null,
          encryptionIv: accessTokenEncrypted.iv,
          authTag: accessTokenEncrypted.authTag,
          oauthExpiresAt: expiresAt,
          oauthScopes: tokens.scope.split(' '),
          isValid: true,
          lastValidatedAt: new Date(),
          validationError: null,
        },
      });
      credentialId = existingCredential.id;
      this.logger.log(
        `Updated Google credential for user ${userId} (${userInfo.email})`,
      );
    } else {
      const newCredential = await this.prisma.credential.create({
        data: {
          userId,
          appId: app.id,
          ...this.encryption.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          oauthRefreshTokenEncrypted: refreshTokenEncrypted?.encrypted || null,
          oauthExpiresAt: expiresAt,
          oauthScopes: tokens.scope.split(' '),
          isValid: true,
          lastValidatedAt: new Date(),
        },
      });
      credentialId = newCredential.id;
      this.logger.log(
        `Created Google credential for user ${userId} (${userInfo.email})`,
      );
    }

    this.n8nCredentialService
      .syncCredentialToN8n(credentialId)
      .catch((error) => {
        this.logger.error(
          `Failed to sync Google credential ${credentialId} to n8n: ${error}`,
        );
      });

    return `${returnUrl}?success=true&provider=google`;
  }

  async handleSlackCallback(code: string, stateParam: string): Promise<string> {
    const { userId, returnUrl } = this.parseState(stateParam);

    const tokens = await this.slackOAuth.exchangeCodeForTokens(code);
    const app = await this.getAppByProvider('slack');

    const existingCredential = await this.prisma.credential.findUnique({
      where: { userId_appId: { userId, appId: app.id } },
    });

    const credentialsData = {
      teamId: tokens.team.id,
      teamName: tokens.team.name,
      botUserId: tokens.bot_user_id,
      appId: tokens.app_id,
    };
    const encryptedCreds = this.encryption.encryptJson(credentialsData);
    const accessTokenEncrypted = this.encryption.encrypt(tokens.access_token);

    let credentialId: string;

    if (existingCredential) {
      await this.prisma.credential.update({
        where: { id: existingCredential.id },
        data: {
          ...this.encryption.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          encryptionIv: accessTokenEncrypted.iv,
          authTag: accessTokenEncrypted.authTag,
          oauthScopes: tokens.scope.split(','),
          isValid: true,
          lastValidatedAt: new Date(),
          validationError: null,
        },
      });
      credentialId = existingCredential.id;
      this.logger.log(
        `Updated Slack credential for user ${userId} (${tokens.team.name})`,
      );
    } else {
      const newCredential = await this.prisma.credential.create({
        data: {
          userId,
          appId: app.id,
          ...this.encryption.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          oauthScopes: tokens.scope.split(','),
          isValid: true,
          lastValidatedAt: new Date(),
        },
      });
      credentialId = newCredential.id;
      this.logger.log(
        `Created Slack credential for user ${userId} (${tokens.team.name})`,
      );
    }

    this.n8nCredentialService
      .syncCredentialToN8n(credentialId)
      .catch((error) => {
        this.logger.error(
          `Failed to sync Slack credential ${credentialId} to n8n: ${error}`,
        );
      });

    return `${returnUrl}?success=true&provider=slack`;
  }
}
