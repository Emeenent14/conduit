import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// Environment Schema
// ============================================

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // n8n
  N8N_API_URL: z.string().url(),
  N8N_API_KEY: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_CALLBACK_URL: z.string().url().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
});

// ============================================
// Validate & Parse
// ============================================

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      console.error(`❌ Missing or invalid environment variables: ${missing}`);
      console.error(error.errors);
    }
    process.exit(1);
  }
};

const env = parseEnv();

// ============================================
// Config Object
// ============================================

export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  frontendUrl: env.FRONTEND_URL,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',

  // Database
  databaseUrl: env.DATABASE_URL,

  // Redis
  redisUrl: env.REDIS_URL,

  // n8n
  n8n: {
    apiUrl: env.N8N_API_URL,
    apiKey: env.N8N_API_KEY,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },

  // Encryption
  encryptionKey: Buffer.from(env.ENCRYPTION_KEY, 'hex'),

  // OAuth
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    },
    slack: {
      clientId: env.SLACK_CLIENT_ID,
      clientSecret: env.SLACK_CLIENT_SECRET,
      callbackUrl: env.SLACK_CALLBACK_URL,
      enabled: !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET),
    },
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.FROM_EMAIL,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER),
  },
} as const;

export type Config = typeof config;
