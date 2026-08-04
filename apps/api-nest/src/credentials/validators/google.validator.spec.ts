import { GoogleCredentialValidator } from './google.validator';

describe(GoogleCredentialValidator, () => {
  let validator: GoogleCredentialValidator;
  let mockGoogleOAuth: { getUserInfo: jest.Mock };

  beforeEach(() => {
    mockGoogleOAuth = { getUserInfo: jest.fn() };
    validator = new GoogleCredentialValidator(mockGoogleOAuth as any);
  });

  describe('validate', () => {
    it('returns a valid result with user details on success', async () => {
      mockGoogleOAuth.getUserInfo.mockResolvedValue({
        email: 'user@example.com',
        name: 'Test User',
      });

      const result = await validator.validate('token-123');

      expect(mockGoogleOAuth.getUserInfo).toHaveBeenCalledWith('token-123');
      expect(result).toEqual({
        isValid: true,
        message: 'Google credential is valid',
        details: { user: { email: 'user@example.com', name: 'Test User' } },
      });
    });

    it('returns an invalid result when getUserInfo rejects', async () => {
      mockGoogleOAuth.getUserInfo.mockRejectedValue(new Error('expired'));

      const result = await validator.validate('token-123');

      expect(result).toEqual({
        isValid: false,
        message: 'Google credential is invalid or expired',
      });
    });
  });
});
