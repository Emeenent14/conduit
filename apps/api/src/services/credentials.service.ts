import { prisma } from '../lib/prisma';
import * as encryptionService from './encryption.service';
import { logger } from '../lib/logger';
import { n8nClient } from './n8n.client';

// ============================================
// Types
// ============================================

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
  // OAuth metadata (if applicable)
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

// ============================================
// Credential Service
// ============================================

/**
 * List all credentials for a user
 */
export async function listUserCredentials(userId: string): Promise<CredentialData[]> {
  const credentials = await prisma.credential.findMany({
    where: { userId },
    include: {
      app: {
        select: {
          id: true,
          slug: true,
          name: true,
          iconUrl: true,
          authType: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
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

/**
 * Get a single credential by ID
 */
export async function getCredentialById(credentialId: string, userId: string): Promise<CredentialData | null> {
  const credential = await prisma.credential.findFirst({
    where: {
      id: credentialId,
      userId, // Ensure user owns this credential
    },
    include: {
      app: {
        select: {
          id: true,
          slug: true,
          name: true,
          iconUrl: true,
          authType: true,
        },
      },
    },
  });

  if (!credential) {
    return null;
  }

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

/**
 * Create an API key credential
 */
export async function createApiKeyCredential(input: CreateApiKeyCredentialInput): Promise<CredentialData> {
  const { userId, appSlug, apiKey, name } = input;

  // Find the app
  const app = await prisma.app.findUnique({
    where: { slug: appSlug },
  });

  if (!app) {
    throw new Error(`App not found: ${appSlug}`);
  }

  if (app.authType !== 'api_key') {
    throw new Error(`App ${appSlug} does not support API key authentication`);
  }

  // Check if credential already exists
  const existingCredential = await prisma.credential.findUnique({
    where: {
      userId_appId: {
        userId,
        appId: app.id,
      },
    },
  });

  if (existingCredential) {
    throw new Error(`You already have a credential for ${app.name}`);
  }

  // Encrypt the API key
  const credentialsData = {
    apiKey,
    name: name || `${app.name} API Key`,
  };
  const encryptedCreds = encryptionService.encryptJson(credentialsData);

  // Create the credential
  const credential = await prisma.credential.create({
    data: {
      userId,
      appId: app.id,
      ...encryptionService.toStorageFormat(encryptedCreds),
      isValid: true, // Will be validated later
    },
    include: {
      app: {
        select: {
          id: true,
          slug: true,
          name: true,
          iconUrl: true,
          authType: true,
        },
      },
    },
  });

  logger.info('Created API key credential', { userId, appSlug });

  return {
    id: credential.id,
    userId: credential.userId,
    app: credential.app,
    isValid: credential.isValid,
    lastValidatedAt: credential.lastValidatedAt,
    validationError: credential.validationError,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
    n8nCredentialId: credential.n8nCredentialId, // Usually null on creation but good to be consistent
  };
}

/**
 * Delete a credential
 */
export async function deleteCredential(credentialId: string, userId: string): Promise<void> {
  const credential = await prisma.credential.findFirst({
    where: {
      id: credentialId,
      userId, // Ensure user owns this credential
    },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  // Delete from n8n if it exists
  if (credential.n8nCredentialId) {
    try {
      await n8nClient.deleteCredential(credential.n8nCredentialId);
      logger.info('Deleted credential from n8n', { credentialId, n8nCredentialId: credential.n8nCredentialId });
    } catch (error) {
      logger.error('Failed to delete credential from n8n', { error, credentialId });
      // Continue with deletion even if n8n fails
    }
  }

  // Delete from database
  await prisma.credential.delete({
    where: { id: credentialId },
  });

  logger.info('Deleted credential', { credentialId, userId });
}

/**
 * Get decrypted access token for a credential (internal use only)
 */
export async function getDecryptedAccessToken(credentialId: string): Promise<string | null> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  if (credential.app.authType === 'oauth2') {
    if (!credential.oauthAccessTokenEncrypted) {
      return null;
    }

    const encryptedData = {
      encrypted: credential.oauthAccessTokenEncrypted,
      iv: credential.encryptionIv,
      authTag: credential.authTag,
    };

    return encryptionService.decrypt(encryptedData);
  } else if (credential.app.authType === 'api_key') {
    const encryptedData = encryptionService.fromStorageFormat({
      credentialsEncrypted: credential.credentialsEncrypted,
      encryptionIv: credential.encryptionIv,
      authTag: credential.authTag,
    });

    const decrypted = encryptionService.decryptJson<{ apiKey: string }>(encryptedData);
    return decrypted.apiKey;
  }

  return null;
}

/**
 * Mark credential as invalid with error message
 */
export async function markCredentialInvalid(credentialId: string, errorMessage: string): Promise<void> {
  await prisma.credential.update({
    where: { id: credentialId },
    data: {
      isValid: false,
      validationError: errorMessage,
      lastValidatedAt: new Date(),
    },
  });

  logger.warn('Marked credential as invalid', { credentialId, errorMessage });
}

/**
 * Mark credential as valid
 */
export async function markCredentialValid(credentialId: string): Promise<void> {
  await prisma.credential.update({
    where: { id: credentialId },
    data: {
      isValid: true,
      validationError: null,
      lastValidatedAt: new Date(),
    },
  });

  logger.info('Marked credential as valid', { credentialId });
}
