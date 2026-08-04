import axios from 'axios';
import { OpenAICredentialValidator } from './openai.validator';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe(OpenAICredentialValidator, () => {
  let validator: OpenAICredentialValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new OpenAICredentialValidator();
  });

  describe('validate', () => {
    it('returns valid with modelCount when response.data.data is an array', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { data: [{ id: 'gpt-4' }, { id: 'gpt-3.5' }] },
      });

      const result = await validator.validate('sk-test');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        {
          headers: { Authorization: 'Bearer sk-test' },
          timeout: 10000,
        },
      );
      expect(result).toEqual({
        isValid: true,
        message: 'OpenAI API key is valid',
        details: { modelCount: 2 },
      });
    });

    it('defaults modelCount to 0 when response.data.data is missing', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await validator.validate('sk-test');

      expect(result).toEqual({
        isValid: true,
        message: 'OpenAI API key is valid',
        details: { modelCount: 0 },
      });
    });

    it('returns "Invalid OpenAI API key" when the request fails with a 401', async () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      mockedAxios.get.mockRejectedValue(error);

      const result = await validator.validate('sk-bad');

      expect(result).toEqual({
        isValid: false,
        message: 'Invalid OpenAI API key',
      });
    });

    it('returns the generic failure message for a different status', async () => {
      const error = { response: { status: 500 }, message: 'Server error' };
      mockedAxios.get.mockRejectedValue(error);

      const result = await validator.validate('sk-test');

      expect(result).toEqual({
        isValid: false,
        message: 'Failed to validate OpenAI API key',
      });
    });

    it('returns the generic failure message when there is no response status', async () => {
      const error = { message: 'Network error' };
      mockedAxios.get.mockRejectedValue(error);

      const result = await validator.validate('sk-test');

      expect(result).toEqual({
        isValid: false,
        message: 'Failed to validate OpenAI API key',
      });
    });
  });
});
