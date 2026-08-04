import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from './env.schema';

/**
 * Wraps @nestjs/config's ConfigService with the same nested shape the
 * Express app's `config` object exposed, so ported services need minimal
 * changes at the call site.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isDev(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return parseInt(this.configService.get('PORT', { infer: true }), 10);
  }

  get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  get n8n() {
    return {
      apiUrl: this.configService.get('N8N_API_URL', { infer: true }),
      apiKey: this.configService.get('N8N_API_KEY', { infer: true }),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }),
      refreshExpiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', {
        infer: true,
      }),
    };
  }

  get encryptionKey(): Buffer {
    const key: string = this.configService.get('ENCRYPTION_KEY', {
      infer: true,
    });
    return Buffer.from(key, 'hex');
  }

  get oauth() {
    const googleClientId = this.configService.get('GOOGLE_CLIENT_ID', {
      infer: true,
    });
    const googleClientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', {
      infer: true,
    });
    const slackClientId = this.configService.get('SLACK_CLIENT_ID', {
      infer: true,
    });
    const slackClientSecret = this.configService.get('SLACK_CLIENT_SECRET', {
      infer: true,
    });

    return {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL', {
          infer: true,
        }),
        enabled: !!(googleClientId && googleClientSecret),
      },
      slack: {
        clientId: slackClientId,
        clientSecret: slackClientSecret,
        callbackUrl: this.configService.get('SLACK_CALLBACK_URL', {
          infer: true,
        }),
        enabled: !!(slackClientId && slackClientSecret),
      },
    };
  }

  get email() {
    const host = this.configService.get('SMTP_HOST', { infer: true });
    const user = this.configService.get('SMTP_USER', { infer: true });
    const portStr = this.configService.get('SMTP_PORT', { infer: true });

    return {
      host,
      port: portStr ? parseInt(portStr, 10) : undefined,
      user,
      pass: this.configService.get('SMTP_PASS', { infer: true }),
      from: this.configService.get('FROM_EMAIL', { infer: true }),
      enabled: !!(host && user),
    };
  }
}
