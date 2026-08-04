import { SlackCredentialValidator } from './slack.validator';

describe(SlackCredentialValidator, () => {
  let validator: SlackCredentialValidator;
  let mockSlackOAuth: { testAccessToken: jest.Mock };

  beforeEach(() => {
    mockSlackOAuth = { testAccessToken: jest.fn() };
    validator = new SlackCredentialValidator(mockSlackOAuth as any);
  });

  describe('validate', () => {
    it('returns a valid result with workspace and user details on success', async () => {
      mockSlackOAuth.testAccessToken.mockResolvedValue({
        team: 'Acme Corp',
        team_id: 'T123',
        user_id: 'U456',
      });

      const result = await validator.validate('token-123');

      expect(mockSlackOAuth.testAccessToken).toHaveBeenCalledWith('token-123');
      expect(result).toEqual({
        isValid: true,
        message: 'Slack credential is valid',
        details: {
          workspace: { name: 'Acme Corp', id: 'T123' },
          user: { id: 'U456' },
        },
      });
    });

    it('returns an invalid result when testAccessToken rejects', async () => {
      mockSlackOAuth.testAccessToken.mockRejectedValue(new Error('revoked'));

      const result = await validator.validate('token-123');

      expect(result).toEqual({
        isValid: false,
        message: 'Slack credential is invalid or revoked',
      });
    });
  });
});
