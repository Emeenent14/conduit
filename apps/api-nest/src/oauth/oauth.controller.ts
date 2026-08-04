import {
  Controller,
  Get,
  Logger,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { AppConfigService } from '../config/app-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { ApiException } from '../common/exceptions/api.exception';

/**
 * Port of routes/oauth.routes.ts + controllers/oauth.controller.ts.
 * Authorize endpoints require auth; callback endpoints are public (identity
 * is carried in the signed `state` parameter).
 */
@Controller('v1/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly oauthService: OAuthService,
    private readonly config: AppConfigService,
  ) {}

  @Get('google/authorize')
  @UseGuards(JwtAuthGuard)
  @Redirect()
  googleAuthorize(
    @CurrentUser() user: RequestUser,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const url = this.oauthService.googleAuthorizeUrl(user.id, returnUrl);
    this.logger.log(`Initiating Google OAuth flow for user ${user.id}`);
    return { url };
  }

  @Get('google/callback')
  @Redirect()
  async googleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      this.logger.warn(`Google OAuth error: ${error}`);
      return {
        url: `${this.config.frontendUrl}/credentials?error=${encodeURIComponent(error)}`,
      };
    }

    if (!code || !state) {
      throw ApiException.badRequest('Missing authorization code or state');
    }

    try {
      const url = await this.oauthService.handleGoogleCallback(code, state);
      return { url };
    } catch (err: any) {
      this.logger.error(`Google OAuth callback error: ${err.message}`);
      return {
        url: `${this.config.frontendUrl}/credentials?error=${encodeURIComponent('OAuth failed. Please try again.')}`,
      };
    }
  }

  @Get('slack/authorize')
  @UseGuards(JwtAuthGuard)
  @Redirect()
  slackAuthorize(
    @CurrentUser() user: RequestUser,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const url = this.oauthService.slackAuthorizeUrl(user.id, returnUrl);
    this.logger.log(`Initiating Slack OAuth flow for user ${user.id}`);
    return { url };
  }

  @Get('slack/callback')
  @Redirect()
  async slackCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      this.logger.warn(`Slack OAuth error: ${error}`);
      return {
        url: `${this.config.frontendUrl}/credentials?error=${encodeURIComponent(error)}`,
      };
    }

    if (!code || !state) {
      throw ApiException.badRequest('Missing authorization code or state');
    }

    try {
      const url = await this.oauthService.handleSlackCallback(code, state);
      return { url };
    } catch (err: any) {
      this.logger.error(`Slack OAuth callback error: ${err.message}`);
      return {
        url: `${this.config.frontendUrl}/credentials?error=${encodeURIComponent('OAuth failed. Please try again.')}`,
      };
    }
  }
}
