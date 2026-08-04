import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiException } from '../exceptions/api.exception';
import { AppConfigService } from '../../config/app-config.service';

interface ErrorBody {
  message?: string | string[];
  code?: string;
  details?: unknown;
}

/**
 * Global equivalent of middleware/errorHandler.ts + notFoundHandler.ts.
 * Produces the exact same { success, error: { code, message, details } }
 * envelope so apps/web doesn't need to change its error handling.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly config: AppConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const err =
      exception instanceof Error ? exception : new Error('Unknown error');

    this.logger.error('Error occurred', {
      error: err.message,
      stack: this.config.isDev ? err.stack : undefined,
      path: request.path,
      method: request.method,
    });

    if (exception instanceof ZodError) {
      const details = exception.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      response.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
      return;
    }

    if (exception instanceof ApiException) {
      response.status(exception.getStatus()).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status: number = exception.getStatus();

      if (status === 404) {
        response.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Route ${request.method} ${request.path} not found`,
          },
        });
        return;
      }

      const body = exception.getResponse();
      const bodyObj =
        typeof body === 'string' ? { message: body } : (body as ErrorBody);
      const message = Array.isArray(bodyObj.message)
        ? bodyObj.message.join(', ')
        : bodyObj.message || exception.message;

      response.status(status).json({
        success: false,
        error: { code: bodyObj.code, message, details: bodyObj.details },
      });
      return;
    }

    response.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: this.config.isDev ? err.message : 'Something went wrong',
      },
    });
  }
}
