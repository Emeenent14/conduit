import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { N8nClientService } from '../n8n/n8n-client.service';

export interface CredentialData {
  id: string;
  userId: string;
  app: {
    id: string;
    slug: string;
    name: string;
    iconUrl: string | null;
    authType: string;
  };
  isValid: boolean;
  lastValidatedAt: Date | null;
  validationError: string | null;
  createdAt: Date;
  updatedAt: Date;
  oauthExpiresAt?: Date | null;
  oauthScopes?: string[];
  n8nCredentialId?: string | null;
}

export interface CreateApiKeyCredentialInput {
  userId: string;
  appSlug: string;
  apiKey: string;
  name?: string;
}

const APP_SELECT = {
  id: true,
  slug: true,
  name: true,
  iconUrl: true,
  authType: true,
} as const;

/**
 * Port of services/credentials.service.ts.
 */
@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly n8nClient: N8nClientService,
  ) {}

  async listUserCredentials(userId: string): Promise<CredentialData[]> {
    const credentials = await this.prisma.credential.findMany({
      where: { userId },
      include: { app: { select: APP_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return credentials.map((cred) => ({
      id: cred.id,
      userId: cred.userId,
      app: cred.app,
      isValid: cred.isValid,
      lastValidatedAt: cred.lastValidatedAt,
      validationError: cred.validationError,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
      oauthExpiresAt: cred.oauthExpiresAt,
      oauthScopes: cred.oauthScopes,
      n8nCredentialId: cred.n8nCredentialId,
    }));
  }

  async getCredentialById(
    credentialId: string,
    userId: string,
  ): Promise<CredentialData | null> {
    const credential = await this.prisma.credential.findFirst({
      where: { id: credentialId, userId },
      include: { app: { select: APP_SELECT } },
    });

    if (!credential) return null;

    return {
      id: credential.id,
      userId: credential.userId,
      app: credential.app,
      isValid: credential.isValid,
      lastValidatedAt: credential.lastValidatedAt,
      validationError: credential.validationError,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      oauthExpiresAt: credential.oauthExpiresAt,
      oauthScopes: credential.oauthScopes,
      n8nCredentialId: credential.n8nCredentialId,
    };
  }

  async createApiKeyCredential(
    input: CreateApiKeyCredentialInput,
  ): Promise<CredentialData> {
    const { userId, appSlug, apiKey, name } = input;

    const app = await this.prisma.app.findUnique({ where: { slug: appSlug } });
    if (!app) {
      throw new Error(`App not found: ${appSlug}`);
    }
    if (app.authType !== 'api_key') {
      throw new Error(`App ${appSlug} does not support API key authentication`);
    }

    const existingCredential = await this.prisma.credential.findUnique({
      where: { userId_appId: { userId, appId: app.id } },
    });
    if (existingCredential) {
      throw new Error(`You already have a credential for ${app.name}`);
    }

    const credentialsData = { apiKey, name: name || `${app.name} API Key` };
    const encryptedCreds = this.encryption.encryptJson(credentialsData);

    const credential = await this.prisma.credential.create({
      data: {
        userId,
        appId: app.id,
        ...this.encryption.toStorageFormat(encryptedCreds),
        isValid: true,
      },
      include: { app: { select: APP_SELECT } },
    });

    this.logger.log(
      `Created API key credential for user ${userId} (${appSlug})`,
    );

    return {
      id: credential.id,
      userId: credential.userId,
      app: credential.app,
      isValid: credential.isValid,
      lastValidatedAt: credential.lastValidatedAt,
      validationError: credential.validationError,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      n8nCredentialId: credential.n8nCredentialId,
    };
  }

  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    const credential = await this.prisma.credential.findFirst({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.n8nCredentialId) {
      try {
        await this.n8nClient.deleteCredential(credential.n8nCredentialId);
        this.logger.log(
          `Deleted credential ${credentialId} from n8n (${credential.n8nCredentialId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to delete credential ${credentialId} from n8n: ${error}`,
        );
      }
    }

    await this.prisma.credential.delete({ where: { id: credentialId } });
    this.logger.log(`Deleted credential ${credentialId} for user ${userId}`);
  }

  async getDecryptedAccessToken(credentialId: string): Promise<string | null> {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { app: true },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.app.authType === 'oauth2') {
      if (!credential.oauthAccessTokenEncrypted) return null;

      return this.encryption.decrypt({
        encrypted: credential.oauthAccessTokenEncrypted,
        iv: credential.encryptionIv,
        authTag: credential.authTag,
      });
    } else if (credential.app.authType === 'api_key') {
      const encryptedData = this.encryption.fromStorageFormat({
        credentialsEncrypted: credential.credentialsEncrypted,
        encryptionIv: credential.encryptionIv,
        authTag: credential.authTag,
      });

      const decrypted = this.encryption.decryptJson<{ apiKey: string }>(
        encryptedData,
      );
      return decrypted.apiKey;
    }

    return null;
  }

  async markCredentialInvalid(
    credentialId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.prisma.credential.update({
      where: { id: credentialId },
      data: {
        isValid: false,
        validationError: errorMessage,
        lastValidatedAt: new Date(),
      },
    });
    this.logger.warn(
      `Marked credential ${credentialId} as invalid: ${errorMessage}`,
    );
  }

  async markCredentialValid(credentialId: string): Promise<void> {
    await this.prisma.credential.update({
      where: { id: credentialId },
      data: {
        isValid: true,
        validationError: null,
        lastValidatedAt: new Date(),
      },
    });
    this.logger.log(`Marked credential ${credentialId} as valid`);
  }
}
