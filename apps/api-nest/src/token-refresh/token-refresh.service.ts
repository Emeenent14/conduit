import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { GoogleOAuthService } from '../oauth/google-oauth.service';
import { N8nCredentialService } from '../n8n/n8n-credential.service';

/**
 * Port of services/token-refresh.service.ts. That file existed in the
 * Express app but was never wired to a scheduler or route -- dead code.
 * Here it's wired to an actual @Cron job, since a scheduled sweep was
 * clearly its intent (see "for scheduled job" in the original docstring).
 */
@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly googleOAuth: GoogleOAuthService,
    private readonly n8nCredentialService: N8nCredentialService,
  ) {}

  private isTokenExpiringSoon(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  private async refreshGoogleToken(credentialId: string): Promise<void> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (!credential.oauthRefreshTokenEncrypted) {
      throw new Error('No refresh token available');
    }

    const refreshToken = this.encryption.decrypt({
      encrypted: credential.oauthRefreshTokenEncrypted,
      iv: credential.encryptionIv,
      authTag: credential.authTag,
    });

    try {
      const tokens = await this.googleOAuth.refreshAccessToken(refreshToken);
      const accessTokenEncrypted = this.encryption.encrypt(tokens.access_token);

      await this.prisma.credential.update({
        where: { id: credentialId },
        data: {
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          encryptionIv: accessTokenEncrypted.iv,
          authTag: accessTokenEncrypted.authTag,
          oauthExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isValid: true,
          validationError: null,
          lastValidatedAt: new Date(),
        },
      });

      await this.n8nCredentialService.resyncCredentialToN8n(credentialId);

      this.logger.log(
        `Successfully refreshed Google OAuth token for credential ${credentialId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to refresh Google OAuth token for credential ${credentialId}: ${error.message}`,
      );

      await this.prisma.credential.update({
        where: { id: credentialId },
        data: {
          isValid: false,
          validationError:
            'Failed to refresh access token. Please reconnect your account.',
          lastValidatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async refreshCredentialToken(credentialId: string): Promise<void> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.app.authType !== 'oauth2') {
      throw new Error('Credential is not OAuth2 type');
    }

    switch (credential.app.slug) {
      case 'google':
        await this.refreshGoogleToken(credentialId);
        break;
      case 'slack':
        this.logger.log(
          `Slack tokens do not require refresh (credential ${credentialId})`,
        );
        break;
      default:
        this.logger.warn(
          `Token refresh not implemented for provider ${credential.app.slug} (credential ${credentialId})`,
        );
    }
  }

  async refreshExpiringTokensForUser(userId: string): Promise<number> {
    const credentials = await this.prisma.credential.findMany({
      where: { userId, oauthExpiresAt: { not: null } },
      include: { app: true },
    });

    let refreshCount = 0;

    for (const credential of credentials) {
      if (this.isTokenExpiringSoon(credential.oauthExpiresAt)) {
        try {
          await this.refreshCredentialToken(credential.id);
          refreshCount++;
        } catch (error) {
          this.logger.error(
            `Failed to refresh token during bulk refresh for credential ${credential.id}: ${error}`,
          );
        }
      }
    }

    if (refreshCount > 0) {
      this.logger.log(
        `Refreshed ${refreshCount}/${credentials.length} expiring tokens for user ${userId}`,
      );
    }

    return refreshCount;
  }

  /**
   * Sweeps all credentials with an OAuth token expiring within 10 minutes
   * and refreshes them. Runs every 10 minutes via @Cron.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshAllExpiringTokens(): Promise<number> {
    const expiringCredentials = await this.prisma.credential.findMany({
      where: {
        oauthExpiresAt: {
          not: null,
          lte: new Date(Date.now() + 10 * 60 * 1000),
        },
        oauthRefreshTokenEncrypted: { not: null },
      },
      include: { app: true },
    });

    let refreshCount = 0;

    for (const credential of expiringCredentials) {
      try {
        await this.refreshCredentialToken(credential.id);
        refreshCount++;
      } catch (error) {
        this.logger.error(
          `Failed to refresh token during scheduled refresh for credential ${credential.id}: ${error}`,
        );
      }
    }

    if (refreshCount > 0) {
      this.logger.log(
        `Completed scheduled token refresh: ${refreshCount}/${expiringCredentials.length}`,
      );
    }

    return refreshCount;
  }

  async getValidAccessToken(credentialId: string): Promise<string> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (
      credential.oauthExpiresAt &&
      this.isTokenExpiringSoon(credential.oauthExpiresAt)
    ) {
      this.logger.log(
        `Token expiring soon, refreshing... (credential ${credentialId})`,
      );
      await this.refreshCredentialToken(credentialId);

      const updatedCredential = await this.prisma.credential.findUnique({
        where: { id: credentialId },
      });

      if (!updatedCredential?.oauthAccessTokenEncrypted) {
        throw new Error('Failed to refresh token');
      }

      return this.encryption.decrypt({
        encrypted: updatedCredential.oauthAccessTokenEncrypted,
        iv: updatedCredential.encryptionIv,
        authTag: updatedCredential.authTag,
      });
    }

    if (!credential.oauthAccessTokenEncrypted) {
      throw new Error('No access token available');
    }

    return this.encryption.decrypt({
      encrypted: credential.oauthAccessTokenEncrypted,
      iv: credential.encryptionIv,
      authTag: credential.authTag,
    });
  }
}
