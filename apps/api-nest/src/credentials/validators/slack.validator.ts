import { Injectable, Logger } from '@nestjs/common';
import { SlackOAuthService } from '../../oauth/slack-oauth.service';
import { CredentialValidator, ValidationResult } from './validator.interface';

@Injectable()
export class SlackCredentialValidator implements CredentialValidator {
  private readonly logger = new Logger(SlackCredentialValidator.name);

  constructor(private readonly slackOAuth: SlackOAuthService) {}

  async validate(accessToken: string): Promise<ValidationResult> {
    try {
      const authTest = await this.slackOAuth.testAccessToken(accessToken);
      return {
        isValid: true,
        message: 'Slack credential is valid',
        details: {
          workspace: { name: authTest.team, id: authTest.team_id },
          user: { id: authTest.user_id },
        },
      };
    } catch (error: any) {
      this.logger.error(`Slack credential validation failed: ${error.message}`);
      return {
        isValid: false,
        message: 'Slack credential is invalid or revoked',
      };
    }
  }
}
