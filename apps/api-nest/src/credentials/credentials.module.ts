import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { GoogleCredentialValidator } from './validators/google.validator';
import { SlackCredentialValidator } from './validators/slack.validator';
import { OpenAICredentialValidator } from './validators/openai.validator';
import { CredentialValidatorRegistry } from './validators/validator-registry.service';
import { AuthModule } from '../auth/auth.module';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [AuthModule, OAuthModule],
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    GoogleCredentialValidator,
    SlackCredentialValidator,
    OpenAICredentialValidator,
    CredentialValidatorRegistry,
  ],
  exports: [CredentialsService],
})
export class CredentialsModule {}
