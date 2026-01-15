import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as oauthController from '../controllers/oauth.controller';

const router = Router();

// ============================================
// Google OAuth Routes
// ============================================

// Start Google OAuth flow (requires authentication)
router.get('/google/authorize', authenticate, oauthController.googleAuthorize);

// Google OAuth callback (no auth required - handled by state parameter)
router.get('/google/callback', oauthController.googleCallback);

// ============================================
// Slack OAuth Routes
// ============================================

// Start Slack OAuth flow (requires authentication)
router.get('/slack/authorize', authenticate, oauthController.slackAuthorize);

// Slack OAuth callback (no auth required - handled by state parameter)
router.get('/slack/callback', oauthController.slackCallback);

export default router;
