import { CredentialValidatorRegistry } from './validator-registry.service';

describe(CredentialValidatorRegistry, () => {
  let registry: CredentialValidatorRegistry;
  let mockGoogle: { validate: jest.Mock };
  let mockSlack: { validate: jest.Mock };
  let mockOpenai: { validate: jest.Mock };

  beforeEach(() => {
    mockGoogle = { validate: jest.fn() };
    mockSlack = { validate: jest.fn() };
    mockOpenai = { validate: jest.fn() };

    registry = new CredentialValidatorRegistry(
      mockGoogle as any,
      mockSlack as any,
      mockOpenai as any,
    );
  });

  describe('validate', () => {
    it('delegates to the google validator', async () => {
      const expected = { isValid: true, message: 'ok' };
      mockGoogle.validate.mockResolvedValue(expected);

      const result = await registry.validate('google', 'token-1');

      expect(mockGoogle.validate).toHaveBeenCalledWith('token-1');
      expect(mockSlack.validate).not.toHaveBeenCalled();
      expect(mockOpenai.validate).not.toHaveBeenCalled();
      expect(result).toBe(expected);
    });

    it('delegates to the slack validator', async () => {
      const expected = { isValid: true, message: 'ok' };
      mockSlack.validate.mockResolvedValue(expected);

      const result = await registry.validate('slack', 'token-2');

      expect(mockSlack.validate).toHaveBeenCalledWith('token-2');
      expect(result).toBe(expected);
    });

    it('delegates to the openai validator', async () => {
      const expected = { isValid: true, message: 'ok' };
      mockOpenai.validate.mockResolvedValue(expected);

      const result = await registry.validate('openai', 'token-3');

      expect(mockOpenai.validate).toHaveBeenCalledWith('token-3');
      expect(result).toBe(expected);
    });

    it('returns a "no validator found" result for an unknown provider without calling any validator', async () => {
      const result = await registry.validate('unknown-provider', 'token-4');

      expect(result).toEqual({
        isValid: false,
        message: 'No validator found for provider: unknown-provider',
      });
      expect(mockGoogle.validate).not.toHaveBeenCalled();
      expect(mockSlack.validate).not.toHaveBeenCalled();
      expect(mockOpenai.validate).not.toHaveBeenCalled();
    });
  });

  describe('hasValidator', () => {
    it('returns true for a known provider', () => {
      expect(registry.hasValidator('slack')).toBe(true);
    });

    it('returns false for an unknown provider', () => {
      expect(registry.hasValidator('nope')).toBe(false);
    });
  });
});
