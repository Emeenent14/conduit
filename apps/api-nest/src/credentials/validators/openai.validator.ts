import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CredentialValidator, ValidationResult } from './validator.interface';

@Injectable()
export class OpenAICredentialValidator implements CredentialValidator {
  private readonly logger = new Logger(OpenAICredentialValidator.name);

  async validate(apiKey: string): Promise<ValidationResult> {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          isValid: true,
          message: 'OpenAI API key is valid',
          details: { modelCount: response.data.data?.length || 0 },
        };
      }

      return { isValid: false, message: 'OpenAI API key validation failed' };
    } catch (error: any) {
      this.logger.error(
        `OpenAI credential validation failed: ${error.message}`,
      );

      if (error.response?.status === 401) {
        return { isValid: false, message: 'Invalid OpenAI API key' };
      }

      return { isValid: false, message: 'Failed to validate OpenAI API key' };
    }
  }
}
