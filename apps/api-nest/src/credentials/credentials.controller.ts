import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialValidatorRegistry } from './validators/validator-registry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { ApiException } from '../common/exceptions/api.exception';

/**
 * Port of routes/credential.routes.ts.
 */
@Controller('v1/credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  private readonly logger = new Logger(CredentialsController.name);

  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly validators: CredentialValidatorRegistry,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.credentialsService.listUserCredentials(user.id);
    return { success: true, data };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() body: { appSlug?: string; apiKey?: string; name?: string },
  ) {
    const { appSlug, apiKey, name } = body;

    if (!appSlug || !apiKey) {
      throw ApiException.badRequest('Missing required fields: appSlug, apiKey');
    }

    const credential = await this.credentialsService.createApiKeyCredential({
      userId: user.id,
      appSlug,
      apiKey,
      name,
    });

    this.logger.log(
      `API key credential created for user ${user.id} (${appSlug})`,
    );

    return { success: true, data: credential };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const credential = await this.credentialsService.getCredentialById(
      id,
      user.id,
    );

    if (!credential) {
      throw ApiException.notFound('Credential');
    }

    return { success: true, data: credential };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    try {
      await this.credentialsService.deleteCredential(id, user.id);
    } catch (error: any) {
      if (error.message === 'Credential not found') {
        throw ApiException.notFound('Credential');
      }
      throw error;
    }

    this.logger.log(`Credential ${id} deleted for user ${user.id}`);

    return { success: true, data: { deleted: true } };
  }

  @Post(':id/test')
  async test(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const credential = await this.credentialsService.getCredentialById(
      id,
      user.id,
    );

    if (!credential) {
      throw ApiException.notFound('Credential');
    }

    const token = await this.credentialsService.getDecryptedAccessToken(id);

    if (!token) {
      throw ApiException.badRequest('No credentials found to test');
    }

    const result = await this.validators.validate(credential.app.slug, token);

    if (result.isValid) {
      await this.credentialsService.markCredentialValid(id);
    } else {
      await this.credentialsService.markCredentialInvalid(
        id,
        result.message || 'Validation failed',
      );
    }

    this.logger.log(
      `Credential ${id} tested for user ${user.id} (${credential.app.slug}): ${result.isValid}`,
    );

    return {
      success: true,
      data: {
        isValid: result.isValid,
        message: result.message,
        details: result.details,
      },
    };
  }
}
