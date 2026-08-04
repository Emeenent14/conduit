import { Module } from '@nestjs/common';
import { TokenRefreshService } from './token-refresh.service';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [OAuthModule],
  providers: [TokenRefreshService],
  exports: [TokenRefreshService],
})
export class TokenRefreshModule {}
