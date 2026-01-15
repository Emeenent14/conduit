import * as slackOAuth from '../oauth/slack.oauth';
import { logger } from '../../lib/logger';

// ============================================
// Slack Credential Validator
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

/**
 * Validate Slack OAuth credential
 */
export async function validateSlackCredential(accessToken: string): Promise<ValidationResult> {
  try {
    // Test the access token
    const authTest = await slackOAuth.testAccessToken(accessToken);

    return {
      isValid: true,
      message: 'Slack credential is valid',
      details: {
        workspace: {
          name: authTest.team,
          id: authTest.team_id,
        },
        user: {
          id: authTest.user_id,
        },
      },
    };
  } catch (error: any) {
    logger.error('Slack credential validation failed', { error: error.message });
    return {
      isValid: false,
      message: 'Slack credential is invalid or revoked',
    };
  }
}
