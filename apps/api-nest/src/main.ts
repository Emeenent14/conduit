import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const config = app.get(AppConfigService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const winstonLogger = app.get<WinstonLogger>(WINSTON_MODULE_PROVIDER);

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({ origin: config.frontendUrl, credentials: true });

  // Body parsing
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  // Compression
  app.use(compression());

  // Request logging
  app.use((req: any, _res: any, next: any) => {
    winstonLogger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Routes are mounted as api/health and api/v1/* (see each controller's
  // @Controller() prefix) to mirror the Express app's `/api/health` +
  // `/api/v1` split exactly.
  app.setGlobalPrefix('api');

  await app.listen(config.port);

  winstonLogger.info(`Conduit API (NestJS) running on port ${config.port}`);
  winstonLogger.info(`Environment: ${config.nodeEnv}`);
  winstonLogger.info(`Frontend URL: ${config.frontendUrl}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start Conduit API (NestJS):', err);
  process.exit(1);
});
