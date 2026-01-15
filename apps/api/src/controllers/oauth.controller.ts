import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import * as googleOAuth from '../services/oauth/google.oauth';
import * as slackOAuth from '../services/oauth/slack.oauth';
import * as encryptionService from '../services/encryption.service';
import * as n8nCredentialService from '../services/n8n-credential.service';

// ============================================
// Types
// ============================================

interface OAuthState {
  userId: string;
  provider: string;
  timestamp: number;
  returnUrl?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate and encode OAuth state parameter
 */
function generateState(userId: string, provider: string, returnUrl?: string): string {
  const state: OAuthState = {
    userId,
    provider,
    timestamp: Date.now(),
    returnUrl,
  };
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

/**
 * Parse and validate OAuth state parameter
 */
function parseState(stateParam: string): OAuthState {
  try {
    const state: OAuthState = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString('utf8')
    );

    // Validate state is not too old (15 minutes)
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (state.timestamp < fifteenMinutesAgo) {
      throw new Error('OAuth state has expired');
    }

    return state;
  } catch (error) {
    throw new Error('Invalid OAuth state parameter');
  }
}

/**
 * Map provider name to App record
 */
async function getAppByProvider(provider: string) {
  const providerMap: Record<string, string> = {
    google: 'google',
    slack: 'slack',
  };

  const appSlug = providerMap[provider];
  if (!appSlug) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  const app = await prisma.app.findUnique({
    where: { slug: appSlug },
  });

  if (!app) {
    throw new Error(`App not found for provider: ${provider}`);
  }

  return app;
}

// ============================================
// Google OAuth Handlers
// ============================================

/**
 * Initialize Google OAuth flow
 * GET /oauth/google/authorize
 */
export async function googleAuthorize(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const returnUrl = (req.query.returnUrl as string) || `${config.frontendUrl}/credentials`;
    const state = generateState(userId, 'google', returnUrl);

    const authUrl = googleOAuth.getAuthorizationUrl(state);

    logger.info('Initiating Google OAuth flow', { userId });
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Google OAuth callback
 * GET /oauth/google/callback
 */
export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state: stateParam, error } = req.query;

    // Handle OAuth errors (user denied permission)
    if (error) {
      logger.warn('Google OAuth error', { error });
      return res.redirect(
        `${config.frontendUrl}/credentials?error=${encodeURIComponent(error as string)}`
      );
    }

    if (!code || !stateParam) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state',
      });
    }

    // Parse and validate state
    const state = parseState(stateParam as string);
    const { userId, returnUrl } = state;

    // Exchange code for tokens
    const tokens = await googleOAuth.exchangeCodeForTokens(code as string);

    // Get user info
    const userInfo = await googleOAuth.getUserInfo(tokens.access_token);

    // Find or create App record
    const app = await getAppByProvider('google');

    // Check if credential already exists
    const existingCredential = await prisma.credential.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: app.id,
        },
      },
    });

    // Encrypt tokens
    const credentialsData = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
    const encryptedCreds = encryptionService.encryptJson(credentialsData);

    const accessTokenEncrypted = encryptionService.encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token
      ? encryptionService.encrypt(tokens.refresh_token)
      : null;

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    let credentialId: string;

    if (existingCredential) {
      // Update existing credential
      await prisma.credential.update({
        where: { id: existingCredential.id },
        data: {
          ...encryptionService.toStorageFormat(encryptedCreds),
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
      logger.info('Updated Google credential', { userId, email: userInfo.email });
    } else {
      // Create new credential
      const newCredential = await prisma.credential.create({
        data: {
          userId,
          appId: app.id,
          ...encryptionService.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          oauthRefreshTokenEncrypted: refreshTokenEncrypted?.encrypted || null,
          oauthExpiresAt: expiresAt,
          oauthScopes: tokens.scope.split(' '),
          isValid: true,
          lastValidatedAt: new Date(),
        },
      });

      credentialId = newCredential.id;
      logger.info('Created Google credential', { userId, email: userInfo.email });
    }

    // Sync to n8n in background (don't wait for it)
    n8nCredentialService.syncCredentialToN8n(credentialId).catch((error) => {
      logger.error('Failed to sync Google credential to n8n', { credentialId, error });
    });

    // Redirect back to frontend
    res.redirect(`${returnUrl}?success=true&provider=google`);
  } catch (error) {
    logger.error('Google OAuth callback error', { error });
    res.redirect(
      `${config.frontendUrl}/credentials?error=${encodeURIComponent('OAuth failed. Please try again.')}`
    );
  }
}

// ============================================
// Slack OAuth Handlers
// ============================================

/**
 * Initialize Slack OAuth flow
 * GET /oauth/slack/authorize
 */
export async function slackAuthorize(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const returnUrl = (req.query.returnUrl as string) || `${config.frontendUrl}/credentials`;
    const state = generateState(userId, 'slack', returnUrl);

    const authUrl = slackOAuth.getAuthorizationUrl(state);

    logger.info('Initiating Slack OAuth flow', { userId });
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Slack OAuth callback
 * GET /oauth/slack/callback
 */
export async function slackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state: stateParam, error } = req.query;

    // Handle OAuth errors (user denied permission)
    if (error) {
      logger.warn('Slack OAuth error', { error });
      return res.redirect(
        `${config.frontendUrl}/credentials?error=${encodeURIComponent(error as string)}`
      );
    }

    if (!code || !stateParam) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state',
      });
    }

    // Parse and validate state
    const state = parseState(stateParam as string);
    const { userId, returnUrl } = state;

    // Exchange code for tokens
    const tokens = await slackOAuth.exchangeCodeForTokens(code as string);

    // Find or create App record
    const app = await getAppByProvider('slack');

    // Check if credential already exists
    const existingCredential = await prisma.credential.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: app.id,
        },
      },
    });

    // Encrypt tokens and workspace data
    const credentialsData = {
      teamId: tokens.team.id,
      teamName: tokens.team.name,
      botUserId: tokens.bot_user_id,
      appId: tokens.app_id,
    };
    const encryptedCreds = encryptionService.encryptJson(credentialsData);

    const accessTokenEncrypted = encryptionService.encrypt(tokens.access_token);

    let credentialId: string;

    if (existingCredential) {
      // Update existing credential
      await prisma.credential.update({
        where: { id: existingCredential.id },
        data: {
          ...encryptionService.toStorageFormat(encryptedCreds),
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
      logger.info('Updated Slack credential', { userId, team: tokens.team.name });
    } else {
      // Create new credential
      const newCredential = await prisma.credential.create({
        data: {
          userId,
          appId: app.id,
          ...encryptionService.toStorageFormat(encryptedCreds),
          oauthAccessTokenEncrypted: accessTokenEncrypted.encrypted,
          oauthScopes: tokens.scope.split(','),
          isValid: true,
          lastValidatedAt: new Date(),
        },
      });

      credentialId = newCredential.id;
      logger.info('Created Slack credential', { userId, team: tokens.team.name });
    }

    // Sync to n8n in background (don't wait for it)
    n8nCredentialService.syncCredentialToN8n(credentialId).catch((error) => {
      logger.error('Failed to sync Slack credential to n8n', { credentialId, error });
    });

    // Redirect back to frontend
    res.redirect(`${returnUrl}?success=true&provider=slack`);
  } catch (error) {
    logger.error('Slack OAuth callback error', { error });
    res.redirect(
      `${config.frontendUrl}/credentials?error=${encodeURIComponent('OAuth failed. Please try again.')}`
    );
  }
}
