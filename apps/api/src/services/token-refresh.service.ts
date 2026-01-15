import { prisma } from '../lib/prisma';
import * as encryptionService from './encryption.service';
import * as googleOAuth from './oauth/google.oauth';
import * as n8nCredentialService from './n8n-credential.service';
import { logger } from '../lib/logger';

// ============================================
// Token Refresh Service
// ============================================

/**
 * Check if OAuth token is expired or expiring soon
 */
function isTokenExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;

  // Consider token expiring if it expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(credentialId: string): Promise<void> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  if (!credential.oauthRefreshTokenEncrypted) {
    throw new Error('No refresh token available');
  }

  // Decrypt refresh token
  const refreshToken = encryptionService.decrypt({
    encrypted: credential.oauthRefreshTokenEncrypted,
    iv: credential.encryptionIv,
    authTag: credential.authTag,
  });

  try {
    // Refresh the token
    const tokens = await googleOAuth.refreshAccessToken(refreshToken);

    // Encrypt new access token
    const accessTokenEncrypted = encryptionService.encrypt(tokens.access_token);

    // Update credential in database
    await prisma.credential.update({
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

    // Resync to n8n
    await n8nCredentialService.resyncCredentialToN8n(credentialId);

    logger.info('Successfully refreshed Google OAuth token', { credentialId });
  } catch (error: any) {
    logger.error('Failed to refresh Google OAuth token', {
      credentialId,
      error: error.message,
    });

    // Mark credential as invalid
    await prisma.credential.update({
      where: { id: credentialId },
      data: {
        isValid: false,
        validationError: 'Failed to refresh access token. Please reconnect your account.',
        lastValidatedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Refresh OAuth token for a credential
 */
export async function refreshCredentialToken(credentialId: string): Promise<void> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  if (credential.app.authType !== 'oauth2') {
    throw new Error('Credential is not OAuth2 type');
  }

  // Refresh based on provider
  switch (credential.app.slug) {
    case 'google':
      await refreshGoogleToken(credentialId);
      break;
    case 'slack':
      // Slack bot tokens don't expire, so no refresh needed
      logger.info('Slack tokens do not require refresh', { credentialId });
      break;
    default:
      logger.warn('Token refresh not implemented for provider', {
        credentialId,
        provider: credential.app.slug,
      });
  }
}

/**
 * Check and refresh expiring tokens for a user
 */
export async function refreshExpiringTokensForUser(userId: string): Promise<number> {
  const credentials = await prisma.credential.findMany({
    where: {
      userId,
      oauthExpiresAt: {
        not: null,
      },
    },
    include: { app: true },
  });

  let refreshCount = 0;

  for (const credential of credentials) {
    if (isTokenExpiringSoon(credential.oauthExpiresAt)) {
      try {
        await refreshCredentialToken(credential.id);
        refreshCount++;
      } catch (error) {
        logger.error('Failed to refresh token during bulk refresh', {
          credentialId: credential.id,
          error,
        });
        // Continue with other credentials
      }
    }
  }

  if (refreshCount > 0) {
    logger.info('Refreshed expiring tokens for user', {
      userId,
      refreshCount,
      total: credentials.length,
    });
  }

  return refreshCount;
}

/**
 * Check and refresh all expiring tokens (for scheduled job)
 */
export async function refreshAllExpiringTokens(): Promise<number> {
  const expiringCredentials = await prisma.credential.findMany({
    where: {
      oauthExpiresAt: {
        not: null,
        lte: new Date(Date.now() + 10 * 60 * 1000), // Expiring within 10 minutes
      },
      oauthRefreshTokenEncrypted: {
        not: null,
      },
    },
    include: { app: true },
  });

  let refreshCount = 0;

  for (const credential of expiringCredentials) {
    try {
      await refreshCredentialToken(credential.id);
      refreshCount++;
    } catch (error) {
      logger.error('Failed to refresh token during scheduled refresh', {
        credentialId: credential.id,
        error,
      });
      // Continue with other credentials
    }
  }

  if (refreshCount > 0) {
    logger.info('Completed scheduled token refresh', {
      refreshCount,
      total: expiringCredentials.length,
    });
  }

  return refreshCount;
}

/**
 * Get credential access token, refreshing if necessary
 */
export async function getValidAccessToken(credentialId: string): Promise<string> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { app: true },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  // Check if token needs refresh
  if (credential.oauthExpiresAt && isTokenExpiringSoon(credential.oauthExpiresAt)) {
    logger.info('Token expiring soon, refreshing...', { credentialId });
    await refreshCredentialToken(credentialId);

    // Refetch credential to get updated token
    const updatedCredential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!updatedCredential?.oauthAccessTokenEncrypted) {
      throw new Error('Failed to refresh token');
    }

    return encryptionService.decrypt({
      encrypted: updatedCredential.oauthAccessTokenEncrypted,
      iv: updatedCredential.encryptionIv,
      authTag: updatedCredential.authTag,
    });
  }

  // Token is still valid
  if (!credential.oauthAccessTokenEncrypted) {
    throw new Error('No access token available');
  }

  return encryptionService.decrypt({
    encrypted: credential.oauthAccessTokenEncrypted,
    iv: credential.encryptionIv,
    authTag: credential.authTag,
  });
}
