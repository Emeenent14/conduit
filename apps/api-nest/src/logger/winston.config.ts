import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

/**
 * Port of lib/logger.ts. NODE_ENV is read directly (not via AppConfigService)
 * because this factory runs during static module setup, before Nest's DI
 * container exists.
 */
export function buildWinstonOptions(): WinstonModuleOptions {
  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = process.env.NODE_ENV === 'production';

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : '';
      return `${timestamp} ${level}: ${message} ${metaStr}`;
    }),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: isDev ? consoleFormat : logFormat,
    }),
  ];

  if (isProd) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5,
      }),
    );
  }

  return {
    level: isDev ? 'debug' : 'info',
    format: logFormat,
    defaultMeta: { service: 'flowmatic-api' },
    transports,
  };
}
