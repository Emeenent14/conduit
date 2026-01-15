import * as googleValidator from './google.validator';
import * as slackValidator from './slack.validator';
import * as openaiValidator from './openai.validator';

// ============================================
// Credential Validator Registry
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

type ValidatorFunction = (credential: string) => Promise<ValidationResult>;

const validators: Record<string, ValidatorFunction> = {
  google: googleValidator.validateGoogleCredential,
  slack: slackValidator.validateSlackCredential,
  openai: openaiValidator.validateOpenAICredential,
};

/**
 * Validate a credential for a specific provider
 */
export async function validateCredential(
  provider: string,
  credential: string
): Promise<ValidationResult> {
  const validator = validators[provider];

  if (!validator) {
    return {
      isValid: false,
      message: `No validator found for provider: ${provider}`,
    };
  }

  return validator(credential);
}

/**
 * Check if a provider has a validator
 */
export function hasValidator(provider: string): boolean {
  return provider in validators;
}

export { googleValidator, slackValidator, openaiValidator };
