import { Module } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { SlackOAuthService } from './slack-oauth.service';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OAuthController],
  providers: [GoogleOAuthService, SlackOAuthService, OAuthService],
  exports: [GoogleOAuthService, SlackOAuthService],
})
export class OAuthModule {}
