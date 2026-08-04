import { Test } from '@nestjs/testing';
import { ArgumentsHost, HttpException } from '@nestjs/common';
import { ZodError, z } from 'zod';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ApiException } from '../exceptions/api.exception';
import { AppConfigService } from '../../config/app-config.service';

describe(AllExceptionsFilter, () => {
  let filter: AllExceptionsFilter;
  let logger: { error: jest.Mock };
  let config: { isDev: boolean };
  let response: { status: jest.Mock; json: jest.Mock };
  let request: { path: string; method: string };
  let host: ArgumentsHost;

  const build = async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
        { provide: AppConfigService, useValue: config },
      ],
    }).compile();

    filter = moduleRef.get(AllExceptionsFilter);
  };

  beforeEach(() => {
    logger = { error: jest.fn() };
    config = { isDev: false };
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    request = { path: '/x', method: 'GET' };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  });

  describe('catch', () => {
    it('logs the error with path and method', async () => {
      await build();
      const error = new Error('boom');

      filter.catch(error, host);

      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred',
        expect.objectContaining({
          error: 'boom',
          path: '/x',
          method: 'GET',
        }),
      );
    });

    it('includes the stack trace in dev', async () => {
      config.isDev = true;
      await build();
      const error = new Error('boom');

      filter.catch(error, host);

      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred',
        expect.objectContaining({ stack: error.stack }),
      );
    });

    it('omits the stack trace outside of dev', async () => {
      config.isDev = false;
      await build();
      const error = new Error('boom');

      filter.catch(error, host);

      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred',
        expect.objectContaining({ stack: undefined }),
      );
    });

    describe('ZodError', () => {
      it('responds 422 with mapped field/message details', async () => {
        await build();
        const schema = z.object({ email: z.string().email() });
        const result = schema.safeParse({ email: 'not-an-email' });
        expect(result.success).toBe(false);
        const zodError = (result as { error: ZodError }).error;

        filter.catch(zodError, host);

        expect(response.status).toHaveBeenCalledWith(422);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: zodError.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      });
    });

    describe('ApiException', () => {
      it('responds with the exception status code, code, message, and details', async () => {
        await build();
        const exception = ApiException.badRequest('Bad input', {
          field: 'name',
        });

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Bad input',
            details: { field: 'name' },
          },
        });
      });

      it('handles ApiException factories without details', async () => {
        await build();
        const exception = ApiException.unauthorized();

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
            details: undefined,
          },
        });
      });
    });

    describe('HttpException', () => {
      it('responds with a "Route X Y not found" message for a 404', async () => {
        await build();
        const exception = new HttpException('Not Found', 404);
        request.method = 'POST';
        request.path = '/missing';

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Route POST /missing not found',
          },
        });
      });

      it('responds using the string body as the message for other statuses', async () => {
        await build();
        const exception = new HttpException('Forbidden here', 403);

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(403);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: undefined,
            message: 'Forbidden here',
            details: undefined,
          },
        });
      });

      it('responds using message/code/details from an object body', async () => {
        await build();
        const exception = new HttpException(
          {
            message: 'Rate limited',
            code: 'RATE_LIMITED',
            details: { retryAfter: 30 },
          },
          429,
        );

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limited',
            details: { retryAfter: 30 },
          },
        });
      });

      it('joins an array message body with commas', async () => {
        await build();
        const exception = new HttpException(
          { message: ['field a is required', 'field b is required'] },
          400,
        );

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: undefined,
            message: 'field a is required, field b is required',
            details: undefined,
          },
        });
      });

      it('falls back to exception.message when the object body has no message', async () => {
        await build();
        const exception = new HttpException({ code: 'WEIRD' }, 418);

        filter.catch(exception, host);

        expect(response.status).toHaveBeenCalledWith(418);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'WEIRD',
            message: exception.message,
            details: undefined,
          },
        });
      });
    });

    describe('unknown errors', () => {
      it('responds 500 with a generic message outside of dev', async () => {
        config.isDev = false;
        await build();
        const error = new Error('sensitive internal detail');

        filter.catch(error, host);

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
        });
      });

      it('responds 500 with the real message in dev', async () => {
        config.isDev = true;
        await build();
        const error = new Error('sensitive internal detail');

        filter.catch(error, host);

        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'sensitive internal detail',
          },
        });
      });

      it('treats a non-Error thrown value as "Unknown error" for logging', async () => {
        config.isDev = true;
        await build();

        filter.catch('just a string', host);

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred',
          expect.objectContaining({ error: 'Unknown error' }),
        );
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Unknown error' },
        });
      });
    });
  });
});
