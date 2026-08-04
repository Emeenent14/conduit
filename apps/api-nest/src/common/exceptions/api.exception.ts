import { HttpException } from '@nestjs/common';

/**
 * Port of the Express app's ApiError. Kept as a thin HttpException subclass
 * so the same static factories and (code, message, details) shape survive
 * the framework port, and AllExceptionsFilter can format responses
 * identically to the old errorHandler middleware.
 */
export class ApiException extends HttpException {
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super({ message, code, details }, statusCode);
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiException {
    return new ApiException(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized'): ApiException {
    return new ApiException(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): ApiException {
    return new ApiException(403, message, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource'): ApiException {
    return new ApiException(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string): ApiException {
    return new ApiException(409, message, 'CONFLICT');
  }

  static validation(details: unknown): ApiException {
    return new ApiException(
      422,
      'Validation error',
      'VALIDATION_ERROR',
      details,
    );
  }

  static internal(message = 'Internal server error'): ApiException {
    return new ApiException(500, message, 'INTERNAL_ERROR');
  }

  static n8nError(message: string): ApiException {
    return new ApiException(502, message, 'N8N_ERROR');
  }
}
