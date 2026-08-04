import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { buildWinstonOptions } from './logger/winston.config';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './encryption/encryption.module';
import { N8nModule } from './n8n/n8n.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { OAuthModule } from './oauth/oauth.module';
import { CredentialsModule } from './credentials/credentials.module';
import { ExecutionsModule } from './executions/executions.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TokenRefreshModule } from './token-refresh/token-refresh.module';

@Module({
  imports: [
    AppConfigModule,
    WinstonModule.forRoot(buildWinstonOptions()),
    ScheduleModule.forRoot(),
    PrismaModule,
    EncryptionModule,
    N8nModule,
    AuthModule,
    UsersModule,
    TemplatesModule,
    OAuthModule,
    CredentialsModule,
    ExecutionsModule,
    WorkflowsModule,
    DashboardModule,
    TokenRefreshModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
