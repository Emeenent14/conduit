import { Injectable } from '@nestjs/common';
import { GoogleCredentialValidator } from './google.validator';
import { SlackCredentialValidator } from './slack.validator';
import { OpenAICredentialValidator } from './openai.validator';
import { CredentialValidator, ValidationResult } from './validator.interface';

/**
 * Port of services/credential-validators/index.ts.
 */
@Injectable()
export class CredentialValidatorRegistry {
  private readonly validators: Record<string, CredentialValidator>;

  constructor(
    google: GoogleCredentialValidator,
    slack: SlackCredentialValidator,
    openai: OpenAICredentialValidator,
  ) {
    this.validators = { google, slack, openai };
  }

  async validate(
    provider: string,
    credential: string,
  ): Promise<ValidationResult> {
    const validator = this.validators[provider];
    if (!validator) {
      return {
        isValid: false,
        message: `No validator found for provider: ${provider}`,
      };
    }
    return validator.validate(credential);
  }

  hasValidator(provider: string): boolean {
    return provider in this.validators;
  }
}
