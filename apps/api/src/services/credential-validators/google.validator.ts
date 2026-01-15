import * as googleOAuth from '../oauth/google.oauth';
import { logger } from '../../lib/logger';

// ============================================
// Google Credential Validator
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

/**
 * Validate Google OAuth credential
 */
export async function validateGoogleCredential(accessToken: string): Promise<ValidationResult> {
  try {
    // Test the access token by getting user info
    const userInfo = await googleOAuth.getUserInfo(accessToken);

    return {
      isValid: true,
      message: 'Google credential is valid',
      details: {
        user: {
          email: userInfo.email,
          name: userInfo.name,
        },
      },
    };
  } catch (error: any) {
    logger.error('Google credential validation failed', { error: error.message });
    return {
      isValid: false,
      message: 'Google credential is invalid or expired',
    };
  }
}
