import { prisma } from '../lib/prisma';
import { n8nClient, N8nCredential } from './n8n.client';
import * as encryptionService from './encryption.service';
import { config } from '../config';
import { logger } from '../lib/logger';

// ============================================
// n8n Credential Type Mappings
// ============================================

/**
 * Map our app slugs to n8n credential types
 */
const N8N_CREDENTIAL_TYPE_MAP: Record<string, string> = {
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
 * Get n8n credential type from app slug
 */
function getN8nCredentialType(appSlug: string): string {
  const type = N8N_CREDENTIAL_TYPE_MAP[appSlug];
  if (!type) {
    throw new Error(`No n8n credential type mapping found for app: ${appSlug}`);
  }
  return type;
}

// ============================================
// Credential Data Formatters
// ============================================

/**
 * Format Google OAuth credential for n8n
 */
function formatGoogleCredential(
  accessToken: string,
  refreshToken: string | null,
  credentialsData: any
): Record<string, any> {
  return {
    accessToken,
    refreshToken: refreshToken || '',
    clientId: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    oauthTokenData: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    },
  };
}

/**
 * Format Slack OAuth credential for n8n
 */
function formatSlackCredential(
  accessToken: string,
  credentialsData: any
): Record<string, any> {
  return {
    accessToken,
    // Slack-specific data from credentialsData
    ...(credentialsData.teamId && { teamId: credentialsData.teamId }),
    ...(credentialsData.teamName && { teamName: credentialsData.teamName }),
  };
}

/**
 * Format OpenAI API key credential for n8n
 */
function formatOpenAICredential(apiKey: string): Record<string, any> {
  return {
    apiKey,
  };
}

/**
 * Format credential data for n8n based on app type
 */
async function formatCredentialForN8n(
  credentialId: string,
  appSlug: string
): Promise<Record<string, any>> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  // Decrypt credentials
  const credentialsData = encryptionService.decryptJson(
    encryptionService.fromStorageFormat({
      credentialsEncrypted: credential.credentialsEncrypted,
      encryptionIv: credential.encryptionIv,
      authTag: credential.authTag,
    })
  );

  if (credential.app.authType === 'oauth2') {
    // Decrypt OAuth tokens
    const accessToken = credential.oauthAccessTokenEncrypted
      ? encryptionService.decrypt({
          encrypted: credential.oauthAccessTokenEncrypted,
          iv: credential.encryptionIv,
          authTag: credential.authTag,
        })
      : '';

    const refreshToken = credential.oauthRefreshTokenEncrypted
      ? encryptionService.decrypt({
          encrypted: credential.oauthRefreshTokenEncrypted,
          iv: credential.encryptionIv,
          authTag: credential.authTag,
        })
      : null;

    // Format based on provider
    switch (appSlug) {
      case 'google':
        return formatGoogleCredential(accessToken, refreshToken, credentialsData);
      case 'slack':
        return formatSlackCredential(accessToken, credentialsData);
      default:
        return {
          accessToken,
          refreshToken: refreshToken || '',
        };
    }
  } else if (credential.app.authType === 'api_key') {
    // Format based on provider
    switch (appSlug) {
      case 'openai':
        return formatOpenAICredential(credentialsData.apiKey);
      default:
        return {
          apiKey: credentialsData.apiKey,
        };
    }
  }

  throw new Error(`Unsupported auth type: ${credential.app.authType}`);
}

// ============================================
// n8n Credential Sync Service
// ============================================

/**
 * Sync credential to n8n
 * Creates a new credential in n8n and stores the n8n credential ID
 */
export async function syncCredentialToN8n(credentialId: string): Promise<string> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true, user: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  try {
    // If already synced, delete old n8n credential first
    if (credential.n8nCredentialId) {
      try {
        await n8nClient.deleteCredential(credential.n8nCredentialId);
        logger.info('Deleted old n8n credential', {
          credentialId,
          n8nCredentialId: credential.n8nCredentialId,
        });
      } catch (error) {
        logger.warn('Failed to delete old n8n credential, continuing...', { error });
      }
    }

    // Format credential data for n8n
    const n8nCredentialData = await formatCredentialForN8n(credentialId, credential.app.slug);

    // Get n8n credential type
    const n8nType = getN8nCredentialType(credential.app.slug);

    // Create n8n credential
    const n8nCredential: N8nCredential = {
      name: `${credential.user.name || 'User'} - ${credential.app.name}`,
      type: n8nType,
      data: n8nCredentialData,
    };

    const { id: n8nCredentialId } = await n8nClient.createCredential(n8nCredential);

    // Update our credential with n8n ID
    await prisma.credential.update({
      where: { id: credentialId },
      data: { n8nCredentialId },
    });

    logger.info('Synced credential to n8n', {
      credentialId,
      n8nCredentialId,
      appSlug: credential.app.slug,
    });

    return n8nCredentialId;
  } catch (error: any) {
    logger.error('Failed to sync credential to n8n', {
      error: error.message,
      credentialId,
      appSlug: credential.app.slug,
    });
    throw new Error(`Failed to sync credential to n8n: ${error.message}`);
  }
}

/**
 * Remove credential from n8n
 */
export async function removeCredentialFromN8n(credentialId: string): Promise<void> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential || !credential.n8nCredentialId) {
    logger.warn('No n8n credential to remove', { credentialId });
    return;
  }

  try {
    await n8nClient.deleteCredential(credential.n8nCredentialId);
    logger.info('Removed credential from n8n', {
      credentialId,
      n8nCredentialId: credential.n8nCredentialId,
    });
  } catch (error: any) {
    logger.error('Failed to remove credential from n8n', {
      error: error.message,
      credentialId,
      n8nCredentialId: credential.n8nCredentialId,
    });
    // Don't throw - allow deletion to continue even if n8n fails
  }
}

/**
 * Resync credential to n8n (useful after token refresh)
 */
export async function resyncCredentialToN8n(credentialId: string): Promise<void> {
  await syncCredentialToN8n(credentialId);
  logger.info('Resynced credential to n8n', { credentialId });
}

/**
 * Sync all credentials for a user to n8n
 */
export async function syncAllUserCredentialsToN8n(userId: string): Promise<number> {
  const credentials = await prisma.credential.findMany({
    where: { userId },
  });

  let syncCount = 0;

  for (const credential of credentials) {
    try {
      await syncCredentialToN8n(credential.id);
      syncCount++;
    } catch (error) {
      logger.error('Failed to sync credential during bulk sync', {
        credentialId: credential.id,
        error,
      });
      // Continue with other credentials
    }
  }

  logger.info('Synced user credentials to n8n', { userId, syncCount, total: credentials.length });
  return syncCount;
}
