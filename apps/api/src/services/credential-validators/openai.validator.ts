import axios from 'axios';
import { logger } from '../../lib/logger';

// ============================================
// OpenAI Credential Validator
// ============================================

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

/**
 * Validate OpenAI API key
 */
export async function validateOpenAICredential(apiKey: string): Promise<ValidationResult> {
  try {
    // Test the API key by listing models
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      return {
        isValid: true,
        message: 'OpenAI API key is valid',
        details: {
          modelCount: response.data.data?.length || 0,
        },
      };
    }

    return {
      isValid: false,
      message: 'OpenAI API key validation failed',
    };
  } catch (error: any) {
    logger.error('OpenAI credential validation failed', { error: error.message });

    if (error.response?.status === 401) {
      return {
        isValid: false,
        message: 'Invalid OpenAI API key',
      };
    }

    return {
      isValid: false,
      message: 'Failed to validate OpenAI API key',
    };
  }
}
