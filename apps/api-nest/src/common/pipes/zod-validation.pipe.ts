import { Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Reuses the Express routes' existing zod schemas for request validation
 * instead of rewriting them as class-validator DTOs. Throws ZodError on
 * failure, which AllExceptionsFilter formats the same way the old
 * errorHandler middleware did.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    return this.schema.parse(value);
  }
}
