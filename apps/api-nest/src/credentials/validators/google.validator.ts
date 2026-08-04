import { Injectable, Logger } from '@nestjs/common';
import { GoogleOAuthService } from '../../oauth/google-oauth.service';
import { CredentialValidator, ValidationResult } from './validator.interface';

@Injectable()
export class GoogleCredentialValidator implements CredentialValidator {
  private readonly logger = new Logger(GoogleCredentialValidator.name);

  constructor(private readonly googleOAuth: GoogleOAuthService) {}

  async validate(accessToken: string): Promise<ValidationResult> {
    try {
      const userInfo = await this.googleOAuth.getUserInfo(accessToken);
      return {
        isValid: true,
        message: 'Google credential is valid',
        details: { user: { email: userInfo.email, name: userInfo.name } },
      };
    } catch (error: any) {
      this.logger.error(
        `Google credential validation failed: ${error.message}`,
      );
      return {
        isValid: false,
        message: 'Google credential is invalid or expired',
      };
    }
  }
}
