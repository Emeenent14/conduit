import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { AppConfigService } from '../config/app-config.service';
import { N8nClientService, N8nCredential } from './n8n-client.service';
import { ApiException } from '../common/exceptions/api.exception';

/**
 * Map our app slugs to n8n credential types. Also used by WorkflowsService
 * to resolve which of a workflow's credentialMappings belongs on a given
 * n8n node, by reversing this same map.
 */
export const N8N_CREDENTIAL_TYPE_MAP: Record<string, string> = {
  google: 'googleOAuth2Api',
  slack: 'slackOAuth2Api',
  openai: 'openAiApi',
  hubspot: 'hubspotOAuth2Api',
  notion: 'notionOAuth2Api',
  airtable: 'airtableOAuth2Api',
  typeform: 'typeformApi',
  mailchimp: 'mailchimpOAuth2Api',
  stripe: 'stripeApi',
};

/**
 * Port of services/n8n-credential.service.ts.
 */
@Injectable()
export class N8nCredentialService {
  private readonly logger = new Logger(N8nCredentialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly config: AppConfigService,
    private readonly n8nClient: N8nClientService,
  ) {}

  private getN8nCredentialType(appSlug: string): string {
    const type = N8N_CREDENTIAL_TYPE_MAP[appSlug];
    if (!type) {
      throw ApiException.internal(
        `No n8n credential type mapping found for app: ${appSlug}`,
      );
    }
    return type;
  }

  private formatGoogleCredential(
    accessToken: string,
    refreshToken: string | null,
  ): Record<string, any> {
    return {
      accessToken,
      refreshToken: refreshToken || '',
      clientId: this.config.oauth.google.clientId,
      clientSecret: this.config.oauth.google.clientSecret,
      oauthTokenData: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
      },
    };
  }

  private formatSlackCredential(
    accessToken: string,
    credentialsData: any,
  ): Record<string, any> {
    return {
      accessToken,
      ...(credentialsData.teamId && { teamId: credentialsData.teamId }),
      ...(credentialsData.teamName && { teamName: credentialsData.teamName }),
    };
  }

  private formatOpenAICredential(apiKey: string): Record<string, any> {
    return { apiKey };
  }

  private async formatCredentialForN8n(
    credentialId: string,
    appSlug: string,
  ): Promise<Record<string, any>> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true },
    });

    if (!credential) {
      throw ApiException.notFound('Credential');
    }

    const credentialsData = this.encryption.decryptJson(
      this.encryption.fromStorageFormat({
        credentialsEncrypted: credential.credentialsEncrypted,
        encryptionIv: credential.encryptionIv,
        authTag: credential.authTag,
      }),
    );

    if (credential.app.authType === 'oauth2') {
      const accessToken = credential.oauthAccessTokenEncrypted
        ? this.encryption.decrypt({
            encrypted: credential.oauthAccessTokenEncrypted,
            iv: credential.encryptionIv,
            authTag: credential.authTag,
          })
        : '';

      const refreshToken = credential.oauthRefreshTokenEncrypted
        ? this.encryption.decrypt({
            encrypted: credential.oauthRefreshTokenEncrypted,
            iv: credential.encryptionIv,
            authTag: credential.authTag,
          })
        : null;

      switch (appSlug) {
        case 'google':
          return this.formatGoogleCredential(accessToken, refreshToken);
        case 'slack':
          return this.formatSlackCredential(accessToken, credentialsData);
        default:
          return { accessToken, refreshToken: refreshToken || '' };
      }
    } else if (credential.app.authType === 'api_key') {
      switch (appSlug) {
        case 'openai':
          return this.formatOpenAICredential(credentialsData.apiKey);
        default:
          return { apiKey: credentialsData.apiKey };
      }
    }

    throw ApiException.internal(
      `Unsupported auth type: ${credential.app.authType}`,
    );
  }

  /**
   * Sync credential to n8n. Creates a new credential in n8n and stores the
   * n8n credential ID.
   */
  async syncCredentialToN8n(credentialId: string): Promise<string> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true, user: true },
    });

    if (!credential) {
      throw ApiException.notFound('Credential');
    }

    try {
      if (credential.n8nCredentialId) {
        try {
          await this.n8nClient.deleteCredential(credential.n8nCredentialId);
          this.logger.log(
            `Deleted old n8n credential ${credential.n8nCredentialId} for credential ${credentialId}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to delete old n8n credential, continuing... ${error}`,
          );
        }
      }

      const n8nCredentialData = await this.formatCredentialForN8n(
        credentialId,
        credential.app.slug,
      );
      const n8nType = this.getN8nCredentialType(credential.app.slug);

      const n8nCredential: N8nCredential = {
        name: `${credential.user.name || 'User'} - ${credential.app.name}`,
        type: n8nType,
        data: n8nCredentialData,
      };

      const { id: n8nCredentialId } =
        await this.n8nClient.createCredential(n8nCredential);

      await this.prisma.credential.update({
        where: { id: credentialId },
        data: { n8nCredentialId },
      });

      this.logger.log(
        `Synced credential ${credentialId} to n8n credential ${n8nCredentialId} (${credential.app.slug})`,
      );

      return n8nCredentialId;
    } catch (error: any) {
      this.logger.error(
        `Failed to sync credential ${credentialId} to n8n: ${error.message}`,
      );
      throw ApiException.n8nError(
        `Failed to sync credential to n8n: ${error.message}`,
      );
    }
  }

  async removeCredentialFromN8n(credentialId: string): Promise<void> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential || !credential.n8nCredentialId) {
      this.logger.warn(`No n8n credential to remove for ${credentialId}`);
      return;
    }

    try {
      await this.n8nClient.deleteCredential(credential.n8nCredentialId);
      this.logger.log(
        `Removed credential ${credentialId} from n8n (${credential.n8nCredentialId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to remove credential ${credentialId} from n8n: ${error.message}`,
      );
    }
  }

  async resyncCredentialToN8n(credentialId: string): Promise<void> {
    await this.syncCredentialToN8n(credentialId);
    this.logger.log(`Resynced credential ${credentialId} to n8n`);
  }

  async syncAllUserCredentialsToN8n(userId: string): Promise<number> {
    const credentials = await this.prisma.credential.findMany({
      where: { userId },
    });

    let syncCount = 0;

    for (const credential of credentials) {
      try {
        await this.syncCredentialToN8n(credential.id);
        syncCount++;
      } catch (error) {
        this.logger.error(
          `Failed to sync credential ${credential.id} during bulk sync: ${error}`,
        );
      }
    }

    this.logger.log(
      `Synced ${syncCount}/${credentials.length} credentials to n8n for user ${userId}`,
    );
    return syncCount;
  }
}
