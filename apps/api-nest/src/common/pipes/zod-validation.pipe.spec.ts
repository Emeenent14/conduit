import { z, ZodError } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe(ZodValidationPipe, () => {
  const schema = z.object({ email: z.string().email() });

  describe('transform', () => {
    it('returns the parsed value unchanged when valid', () => {
      const pipe = new ZodValidationPipe(schema);
      const input = { email: 'user@example.com' };

      expect(pipe.transform(input)).toEqual(input);
    });

    it('throws a ZodError when the value is invalid', () => {
      const pipe = new ZodValidationPipe(schema);
      const input = { email: 'not-an-email' };

      expect(() => pipe.transform(input)).toThrow(ZodError);
    });

    it('throws a ZodError when required fields are missing', () => {
      const pipe = new ZodValidationPipe(schema);

      expect(() => pipe.transform({})).toThrow(ZodError);
    });
  });
});
